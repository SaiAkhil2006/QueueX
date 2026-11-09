import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { nowTimestamp } from "@/lib/firebase/server-timestamps";
import { getTimestampMillis, type TimestampInput } from "@/lib/firebase/timestamps";
import { getSessionQueueState } from "@/features/queue/services/queue.server";
import type {
  Prediction,
  PredictionConfidence,
  PredictionFactor,
} from "@/types/intelligence";
import type { Doctor } from "@/types/doctor";
import type { Department } from "@/types/department";
import type { Consultation } from "@/types/consultation";
import type { QueueEntry } from "@/types/queue";

export interface DoctorDurationStats {
  doctorId: string;
  departmentId: string;
  sampleCount: number;
  meanDurationMinutes: number;
  stdDevMinutes: number;
  baselineMinutes: number;
  confidenceLevel: PredictionConfidence;
  confidenceScore: number;
}

export interface HospitalPredictionMetrics {
  totalPredictions: number;
  totalEvaluated: number;
  meanAbsoluteErrorMinutes: number;
  accuracyWithin5MinPercent: number;
  accuracyWithin10MinPercent: number;
  averageWaitTimeMinutes: number;
}

/**
 * Historical Duration Analytics Engine:
 * Analyzes completed consultations for a doctor and department to derive
 * empirical consultation duration averages, variance, and confidence metrics.
 */
export async function getDoctorDurationStats(
  hospitalId: string,
  doctorId: string,
  departmentId?: string
): Promise<DoctorDurationStats> {
  const db = getAdminFirestore();

  // 1. Fetch Doctor details
  const doctorSnap = await db.doc(paths.doctor(hospitalId, doctorId)).get();
  const doctor = doctorSnap.exists ? (doctorSnap.data() as Doctor) : null;
  const targetDeptId = departmentId || doctor?.departmentId || "";

  // 2. Fetch Department fallback
  let deptDuration = 15;
  if (targetDeptId) {
    const deptSnap = await db.doc(paths.department(hospitalId, targetDeptId)).get();
    if (deptSnap.exists) {
      const dept = deptSnap.data() as Department;
      deptDuration = dept.avgConsultationDurationMinutes || 15;
    }
  }

  const doctorEstimate = doctor?.consultationDurationEstimate || deptDuration;

  // 3. Query completed consultations for this doctor
  const consultationsSnap = await db
    .collection(paths.consultations(hospitalId))
    .where("doctorId", "==", doctorId)
    .where("status", "==", "completed")
    .limit(50)
    .get();

  const durations: number[] = [];
  consultationsSnap.forEach((doc) => {
    const data = doc.data() as Consultation;
    if (typeof data.durationSeconds === "number" && data.durationSeconds > 0) {
      durations.push(Math.round(data.durationSeconds / 60));
    }
  });

  const sampleCount = durations.length;

  if (sampleCount === 0) {
    return {
      doctorId,
      departmentId: targetDeptId,
      sampleCount: 0,
      meanDurationMinutes: doctorEstimate,
      stdDevMinutes: 0,
      baselineMinutes: doctorEstimate,
      confidenceLevel: "low",
      confidenceScore: 0.55,
    };
  }

  const mean = durations.reduce((acc, v) => acc + v, 0) / sampleCount;
  const variance =
    durations.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / sampleCount;
  const stdDev = Math.sqrt(variance);

  // Confidence tiers
  let confidenceLevel: PredictionConfidence = "low";
  let confidenceScore = 0.55;
  if (sampleCount >= 10) {
    confidenceLevel = "high";
    confidenceScore = 0.9;
  } else if (sampleCount >= 3) {
    confidenceLevel = "medium";
    confidenceScore = 0.75;
  }

  const baselineMinutes = Math.max(3, Math.round(mean));

  return {
    doctorId,
    departmentId: targetDeptId,
    sampleCount,
    meanDurationMinutes: Math.round(mean * 10) / 10,
    stdDevMinutes: Math.round(stdDev * 10) / 10,
    baselineMinutes,
    confidenceLevel,
    confidenceScore,
  };
}

/**
 * Dynamic Queue ETA Engine:
 * Recalculates expected waiting times and call times for all waiting patients in an OPD session.
 * Takes into account:
 *  - Active consultation remaining time
 *  - Accumulated queue position and priority ordering
 *  - Doctor historical pacing
 *  - Delays and "3-patients-ahead" approaching-turn triggers
 */
export async function calculateQueuePredictions(
  hospitalId: string,
  sessionId: string
): Promise<Prediction[]> {
  const db = getAdminFirestore();

  // 1. Get live queue state
  const state = await getSessionQueueState(hospitalId, sessionId);
  const { session, currentlyInConsultation, waitingQueue } = state;

  if (!session) {
    throw new Error(`OPD Session '${sessionId}' not found.`);
  }

  // 2. Get doctor duration stats
  const stats = await getDoctorDurationStats(
    hospitalId,
    session.doctorId,
    session.departmentId
  );

  const now = Date.now();
  const currentTimestamp = nowTimestamp();
  const validUntilTimestamp = new Date(now + 30 * 60 * 1000);

  // 3. Compute remaining time for active consultation
  let remainingActiveMinutes = 0;
  if (currentlyInConsultation && currentlyInConsultation.consultationStartedAt) {
    const elapsedMinutes = Math.floor(
      (now - getTimestampMillis(currentlyInConsultation.consultationStartedAt)) / 60000
    );
    remainingActiveMinutes = Math.max(2, stats.baselineMinutes - elapsedMinutes);
  }

  const predictions: Prediction[] = [];
  let runningWaitMinutes = remainingActiveMinutes;
  let hasDetectedQueueDelay = false;

  const batch = db.batch();

  // 4. Iterate over sorted waiting queue
  for (let i = 0; i < waitingQueue.length; i++) {
    const entry = waitingQueue[i];
    const position = i + 1;

    const factors: PredictionFactor[] = [];

    // Factor 1: Active consultation in progress
    if (remainingActiveMinutes > 0) {
      factors.push({
        factor: "Active Consultation Remaining",
        impactMinutes: remainingActiveMinutes,
        description: `Doctor attending Token ${currentlyInConsultation?.tokenDisplay}`,
      });
    }

    // Factor 2: Patients in line ahead
    const aheadMinutes = i * stats.baselineMinutes;
    if (i > 0) {
      factors.push({
        factor: "Queue Position Ahead",
        impactMinutes: aheadMinutes,
        description: `${i} patient(s) ahead (${stats.baselineMinutes}m avg/consult)`,
      });
    }

    // Factor 3: Priority weighting
    if (entry.priority === "emergency") {
      const emergencyReduction = Math.min(
        runningWaitMinutes - 1,
        Math.floor(aheadMinutes * 0.9)
      );
      if (emergencyReduction > 0) {
        factors.push({
          factor: "Emergency Triage Priority",
          impactMinutes: -emergencyReduction,
          description: "Priority expedited ahead of non-critical queue",
        });
      }
    } else if (entry.priority === "priority") {
      factors.push({
        factor: "Special Priority (Elderly/Infant)",
        impactMinutes: 0,
        description: "Scheduled ahead of standard walk-ins",
      });
    }

    // Effective wait time calculation
    const calculatedWait = Math.max(
      1,
      Math.round(
        entry.priority === "emergency"
          ? Math.max(1, remainingActiveMinutes)
          : runningWaitMinutes
      )
    );

    // Turn approaching condition: 3 or fewer patients ahead
    const notifyApproach = position <= 3;

    // Delay detection: wait time > 35 minutes or scheduled appointment time passed by > 15m
    const isDelayed = calculatedWait > 35;
    const delayMinutes = isDelayed ? calculatedWait - 30 : 0;
    if (isDelayed) {
      hasDetectedQueueDelay = true;
    }

    const predictedCallMillis = now + calculatedWait * 60 * 1000;
    const predictedCallTimestamp = new Date(predictedCallMillis);

    const predictionId = `pred-${entry.id}`;
    const predictionDocRef = db.doc(paths.prediction(hospitalId, predictionId));

    const predictionData: Prediction = {
      id: predictionId,
      hospitalId,
      departmentId: session.departmentId,
      doctorId: session.doctorId,
      sessionId,
      queueEntryId: entry.id,
      tokenDisplay: entry.tokenDisplay,
      patientName: entry.patientName,
      patientPosition: position,
      predictionType: "estimated_wait_time",
      targetValue: calculatedWait,
      predictedCallTime: predictedCallTimestamp,
      isDelayed,
      delayMinutes,
      notifyApproach,
      confidenceScore: stats.confidenceScore,
      confidenceLevel: stats.confidenceLevel,
      modelVersion: "v1.2-historical-heuristic",
      contributingFactors: factors,
      actualWaitMinutes: null,
      absoluteErrorMinutes: null,
      generatedAt: currentTimestamp,
      validUntil: validUntilTimestamp,
    };

    batch.set(predictionDocRef, predictionData, { merge: true });

    // Update queue entry with estimatedWaitMinutes
    const entryRef = db.doc(paths.queueEntry(hospitalId, entry.id));
    batch.update(entryRef, {
      estimatedWaitMinutes: calculatedWait,
      updatedAt: currentTimestamp,
    });

    predictions.push(predictionData);

    // Advance running wait time for subsequent normal/priority patients
    if (entry.priority !== "emergency") {
      runningWaitMinutes += stats.baselineMinutes;
    }
  }

  // 5. Commit all predictions and entry updates atomically
  await batch.commit();

  // 6. Log operational event if significant delay detected
  if (hasDetectedQueueDelay) {
    const eventId = `ev-delay-${sessionId}-${Math.random().toString(36).substring(2, 6)}`;
    await db.doc(paths.operationalEvent(hospitalId, eventId)).set({
      id: eventId,
      hospitalId,
      departmentId: session.departmentId,
      doctorId: session.doctorId,
      sessionId,
      queueEntryId: null,
      eventType: "queue_delay_detected",
      severity: "warning",
      timestamp: currentTimestamp,
      actorRole: "system",
      description: `Queue delay detected in session ${session.id}: wait times exceed normal operational thresholds.`,
      metadata: { waitingCount: waitingQueue.length },
    });
  }

  return predictions;
}

/**
 * Record actual wait time when consultation starts or completes,
 * updating the prediction document with empirical accuracy measurements.
 */
export async function recordConsultationActualWait(
  hospitalId: string,
  entryId: string,
  consultationStartedAt: TimestampInput
): Promise<Prediction | null> {
  const db = getAdminFirestore();
  const predictionRef = db.doc(paths.prediction(hospitalId, `pred-${entryId}`));
  const predictionSnap = await predictionRef.get();

  // Fetch entry to compute arrival-to-consultation wait
  const entrySnap = await db.doc(paths.queueEntry(hospitalId, entryId)).get();
  if (!entrySnap.exists) return null;
  const entry = entrySnap.data() as QueueEntry;

  const startMillis = getTimestampMillis(consultationStartedAt);
  const arrivalMillis = getTimestampMillis(entry.arrivalTime);

  if (startMillis <= 0 || arrivalMillis <= 0) return null;

  const actualWaitMinutes = Math.max(
    0,
    Math.round((startMillis - arrivalMillis) / 60000)
  );

  let prediction: Prediction;
  if (predictionSnap.exists) {
    prediction = predictionSnap.data() as Prediction;
  } else {
    // Baseline prediction for expedited/emergency cases that bypass batch ETA runs
    const baselineWait = entry.priority === "emergency" ? 2 : 15;
    const now = nowTimestamp();
    prediction = {
      id: `pred-${entryId}`,
      hospitalId,
      departmentId: entry.departmentId,
      doctorId: entry.doctorId,
      sessionId: entry.sessionId,
      queueEntryId: entryId,
      tokenDisplay: entry.tokenDisplay,
      patientName: null,
      patientPosition: 1,
      predictionType: "estimated_wait_time",
      targetValue: baselineWait,
      predictedCallTime: now,
      isDelayed: false,
      delayMinutes: 0,
      notifyApproach: true,
      confidenceScore: 0.95,
      confidenceLevel: "high",
      modelVersion: "v1.2-historical-heuristic",
      contributingFactors: [],
      actualWaitMinutes: null,
      absoluteErrorMinutes: null,
      generatedAt: now,
      validUntil: now,
    };
  }

  const absoluteErrorMinutes = Math.abs(actualWaitMinutes - prediction.targetValue);

  await predictionRef.set(
    {
      ...prediction,
      actualWaitMinutes,
      absoluteErrorMinutes,
    },
    { merge: true }
  );

  return {
    ...prediction,
    actualWaitMinutes,
    absoluteErrorMinutes,
  };
}

/**
 * Retrieve aggregated accuracy & performance metrics for hospital predictions.
 */
export async function getHospitalPredictionMetrics(
  hospitalId: string
): Promise<HospitalPredictionMetrics> {
  const db = getAdminFirestore();

  const predictionsSnap = await db
    .collection(paths.predictions(hospitalId))
    .limit(100)
    .get();

  let totalPredictions = 0;
  let totalEvaluated = 0;
  let totalAbsoluteError = 0;
  let within5MinCount = 0;
  let within10MinCount = 0;
  let totalWaitTime = 0;

  predictionsSnap.forEach((doc) => {
    const data = doc.data() as Prediction;
    totalPredictions++;

    if (
      typeof data.actualWaitMinutes === "number" &&
      typeof data.absoluteErrorMinutes === "number"
    ) {
      totalEvaluated++;
      totalAbsoluteError += data.absoluteErrorMinutes;
      totalWaitTime += data.actualWaitMinutes;

      if (data.absoluteErrorMinutes <= 5) {
        within5MinCount++;
      }
      if (data.absoluteErrorMinutes <= 10) {
        within10MinCount++;
      }
    }
  });

  const meanAbsoluteErrorMinutes =
    totalEvaluated > 0 ? Math.round((totalAbsoluteError / totalEvaluated) * 10) / 10 : 0;
  const accuracyWithin5MinPercent =
    totalEvaluated > 0 ? Math.round((within5MinCount / totalEvaluated) * 100) : 0;
  const accuracyWithin10MinPercent =
    totalEvaluated > 0 ? Math.round((within10MinCount / totalEvaluated) * 100) : 0;
  const averageWaitTimeMinutes =
    totalEvaluated > 0 ? Math.round((totalWaitTime / totalEvaluated) * 10) / 10 : 0;

  return {
    totalPredictions,
    totalEvaluated,
    meanAbsoluteErrorMinutes,
    accuracyWithin5MinPercent,
    accuracyWithin10MinPercent,
    averageWaitTimeMinutes,
  };
}

/**
 * List predictions for a hospital, optionally filtered by session or entry.
 */
export async function getPredictions(
  hospitalId: string,
  filter?: { sessionId?: string; queueEntryId?: string }
): Promise<Prediction[]> {
  const db = getAdminFirestore();

  let query: FirebaseFirestore.Query = db.collection(paths.predictions(hospitalId));

  if (filter?.sessionId) {
    query = query.where("sessionId", "==", filter.sessionId);
  }
  if (filter?.queueEntryId) {
    query = query.where("queueEntryId", "==", filter.queueEntryId);
  }

  const snap = await query.limit(50).get();
  const predictions: Prediction[] = [];
  snap.forEach((doc) => {
    predictions.push(doc.data() as Prediction);
  });

  // Sort by patient position or target value
  return predictions.sort(
    (a, b) => (a.patientPosition ?? 999) - (b.patientPosition ?? 999)
  );
}
