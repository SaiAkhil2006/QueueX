import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { nowTimestamp } from "@/lib/firebase/server-timestamps";
import { getSessionQueueState } from "@/features/queue/services/queue.server";
import { calculateQueuePredictions } from "@/features/predictions/services/predictions.server";
import type {
  Recommendation,
  RecommendationStatus,
} from "@/types/intelligence";
import type { Department } from "@/types/department";
import type { Doctor } from "@/types/doctor";
import type { OPDSession } from "@/types/scheduling";
import type { QueueEntry } from "@/types/queue";

export interface SessionWorkloadSummary {
  sessionId: string;
  doctorId: string;
  doctorName: string;
  roomNumber: string;
  waitingCount: number;
  inConsultation: boolean;
  activeTokenDisplay?: string;
  estimatedBacklogMinutes: number;
}

export interface DepartmentWorkload {
  departmentId: string;
  departmentName: string;
  activeSessions: SessionWorkloadSummary[];
  totalWaiting: number;
  avgWaitMinutes: number;
  hasImbalance: boolean;
  imbalanceDelta: number;
}

/**
 * Workload Analysis Engine:
 * Analyzes active doctor queue lengths and backlog in a department to identify
 * distribution bottlenecks and workload imbalances.
 */
export async function analyzeDepartmentWorkload(
  hospitalId: string,
  departmentId: string
): Promise<DepartmentWorkload> {
  const db = getAdminFirestore();

  // 1. Fetch Department Info
  const deptSnap = await db.doc(paths.department(hospitalId, departmentId)).get();
  const deptName = deptSnap.exists
    ? (deptSnap.data() as Department).name
    : "Department";

  // 2. Fetch all active sessions in this department
  const sessionsSnap = await db
    .collection(paths.sessions(hospitalId))
    .where("departmentId", "==", departmentId)
    .where("status", "==", "active")
    .get();

  const activeSessions: SessionWorkloadSummary[] = [];
  let totalWaiting = 0;

  for (const doc of sessionsSnap.docs) {
    const session = doc.data() as OPDSession;
    const state = await getSessionQueueState(hospitalId, session.id);

    // Fetch doctor name
    let doctorName = "Attending Physician";
    const docSnap = await db.doc(paths.doctor(hospitalId, session.doctorId)).get();
    if (docSnap.exists) {
      doctorName = (docSnap.data() as Doctor).name;
    }

    const waitingCount = state.waitingQueue.length;
    totalWaiting += waitingCount;

    activeSessions.push({
      sessionId: session.id,
      doctorId: session.doctorId,
      doctorName,
      roomNumber: session.roomNumber,
      waitingCount,
      inConsultation: Boolean(state.currentlyInConsultation),
      activeTokenDisplay: state.currentlyInConsultation?.tokenDisplay,
      estimatedBacklogMinutes: waitingCount * 12,
    });
  }

  // 3. Imbalance Heuristic
  let hasImbalance = false;
  let imbalanceDelta = 0;

  if (activeSessions.length >= 2) {
    activeSessions.sort((a, b) => b.waitingCount - a.waitingCount);
    const maxSession = activeSessions[0];
    const minSession = activeSessions[activeSessions.length - 1];

    imbalanceDelta = maxSession.waitingCount - minSession.waitingCount;

    // Condition: Max session has >= 3 waiting AND has >= 2 more than min session
    if (maxSession.waitingCount >= 3 && imbalanceDelta >= 2) {
      hasImbalance = true;
    }
  }

  const avgWaitMinutes =
    activeSessions.length > 0
      ? Math.round((totalWaiting * 12) / activeSessions.length)
      : 0;

  return {
    departmentId,
    departmentName: deptName,
    activeSessions,
    totalWaiting,
    avgWaitMinutes,
    hasImbalance,
    imbalanceDelta,
  };
}

/**
 * Recommendation Generation Engine:
 * Analyzes operational bottlenecks and formulates human-in-the-loop recommendations.
 */
export async function generateRecommendations(
  hospitalId: string,
  targetDepartmentId?: string
): Promise<Recommendation[]> {
  const db = getAdminFirestore();

  // Determine departments to evaluate
  const departmentsToEvaluate: string[] = [];
  if (targetDepartmentId) {
    departmentsToEvaluate.push(targetDepartmentId);
  } else {
    const deptsSnap = await db.collection(paths.departments(hospitalId)).get();
    deptsSnap.forEach((d) => departmentsToEvaluate.push(d.id));
  }

  const generated: Recommendation[] = [];
  const now = nowTimestamp();

  for (const deptId of departmentsToEvaluate) {
    const workload = await analyzeDepartmentWorkload(hospitalId, deptId);

    // Rule 1: Queue Rebalancing between Doctors
    if (workload.hasImbalance && workload.activeSessions.length >= 2) {
      const maxSession = workload.activeSessions[0];
      const minSession = workload.activeSessions[workload.activeSessions.length - 1];

      // Retrieve state of maxSession to identify candidate patient to rebalance
      const maxState = await getSessionQueueState(hospitalId, maxSession.sessionId);
      // Pick a normal priority waiting patient from the middle/tail of the queue
      const normalPatients = maxState.waitingQueue.filter((e) => e.priority === "normal");
      const candidate =
        normalPatients.length > 1
          ? normalPatients[Math.floor(normalPatients.length / 2)]
          : normalPatients[0];

      if (candidate) {
        const recId = `rec-rebal-${maxSession.sessionId}-${minSession.sessionId}-${candidate.id}`;

        // Check if pending recommendation already exists
        const existingSnap = await db.doc(paths.recommendation(hospitalId, recId)).get();
        if (!existingSnap.exists) {
          const rec: Recommendation = {
            id: recId,
            hospitalId,
            departmentId: deptId,
            sessionId: maxSession.sessionId,
            type: "rebalance_queue",
            title: `Rebalance Queue: Transfer patient to Dr. ${minSession.doctorName}`,
            description: `Dr. ${maxSession.doctorName} (Room ${maxSession.roomNumber}) has ${maxSession.waitingCount} waiting patients, whereas Dr. ${minSession.doctorName} (Room ${minSession.roomNumber}) has only ${minSession.waitingCount}. Transfer Token ${candidate.tokenDisplay} (${candidate.patientName}) to balance load.`,
            priority: workload.imbalanceDelta >= 4 ? "urgent" : "high",
            status: "pending",
            impactEstimate: `Reduces Dr. ${maxSession.doctorName}'s queue by ~12m; levels department wait-times.`,
            actionPayload: {
              sourceSessionId: maxSession.sessionId,
              targetSessionId: minSession.sessionId,
              queueEntryId: candidate.id,
              patientId: candidate.patientId,
              patientName: candidate.patientName,
              sourceDoctorName: maxSession.doctorName,
              targetDoctorId: minSession.doctorId,
              targetDoctorName: minSession.doctorName,
              targetRoomNumber: minSession.roomNumber,
            },
            createdAt: now,
            appliedAt: null,
            appliedBy: null,
          };

          await db.doc(paths.recommendation(hospitalId, recId)).set(rec);
          generated.push(rec);
        }
      }
    }

    // Rule 2: Department-wide Surge (High Waiting Queue)
    if (workload.totalWaiting >= 8 && workload.activeSessions.length === 1) {
      const recId = `rec-surge-${deptId}-${Date.now().toString().slice(-4)}`;
      const existing = await db
        .collection(paths.recommendations(hospitalId))
        .where("departmentId", "==", deptId)
        .where("type", "==", "call_next_doctor")
        .where("status", "==", "pending")
        .limit(1)
        .get();

      if (existing.empty) {
        const rec: Recommendation = {
          id: recId,
          hospitalId,
          departmentId: deptId,
          sessionId: workload.activeSessions[0]?.sessionId || null,
          type: "call_next_doctor",
          title: `Deploy On-Call Physician in ${workload.departmentName}`,
          description: `Department surge detected with ${workload.totalWaiting} waiting patients on a single active physician. Open a parallel consultation room.`,
          priority: "urgent",
          status: "pending",
          impactEstimate: "Reduces patient waiting times by ~45%.",
          actionPayload: {
            departmentId: deptId,
            currentWaiting: workload.totalWaiting,
          },
          createdAt: now,
          appliedAt: null,
          appliedBy: null,
        };

        await db.doc(paths.recommendation(hospitalId, recId)).set(rec);
        generated.push(rec);
      }
    }
  }

  return generated;
}

/**
 * Execute an approved recommendation (Human-in-the-loop action).
 */
export async function applyRecommendation(
  hospitalId: string,
  recommendationId: string,
  actorRole = "admin",
  actorId = "system"
): Promise<Recommendation> {
  const db = getAdminFirestore();
  const recRef = db.doc(paths.recommendation(hospitalId, recommendationId));
  const recSnap = await recRef.get();

  if (!recSnap.exists) {
    throw new Error(`Recommendation '${recommendationId}' not found.`);
  }

  const rec = recSnap.data() as Recommendation;
  if (rec.status !== "pending") {
    throw new Error(`Recommendation is already '${rec.status}'.`);
  }

  const now = nowTimestamp();

  // Execute based on recommendation type
  if (rec.type === "rebalance_queue") {
    const {
      sourceSessionId,
      targetSessionId,
      queueEntryId,
      targetDoctorId,
      targetDoctorName,
      targetRoomNumber,
      sourceDoctorName,
    } = rec.actionPayload as {
      sourceSessionId: string;
      targetSessionId: string;
      queueEntryId: string;
      targetDoctorId: string;
      targetDoctorName: string;
      targetRoomNumber: string;
      sourceDoctorName: string;
    };

    // Run rebalance inside a Firestore transaction
    await db.runTransaction(async (transaction) => {
      const entryRef = db.doc(paths.queueEntry(hospitalId, queueEntryId));
      const sourceSessionRef = db.doc(paths.session(hospitalId, sourceSessionId));
      const targetSessionRef = db.doc(paths.session(hospitalId, targetSessionId));

      // Reads first
      const [entrySnap, sourceSnap, targetSnap] = await Promise.all([
        transaction.get(entryRef),
        transaction.get(sourceSessionRef),
        transaction.get(targetSessionRef),
      ]);

      if (!entrySnap.exists) {
        throw new Error(`Queue entry '${queueEntryId}' not found for rebalance.`);
      }
      const entry = entrySnap.data() as QueueEntry;
      const sourceSession = sourceSnap.data() as OPDSession;
      const targetSession = targetSnap.data() as OPDSession;

      // Writes
      transaction.update(entryRef, {
        sessionId: targetSessionId,
        doctorId: targetDoctorId,
        doctorName: targetDoctorName,
        notes: entry.notes
          ? `${entry.notes} (Reassigned to Room ${targetRoomNumber})`
          : `Reassigned from Dr. ${sourceDoctorName} to Dr. ${targetDoctorName} (Room ${targetRoomNumber})`,
        updatedAt: now,
      });

      transaction.update(sourceSessionRef, {
        waitingCount: Math.max(0, (sourceSession.waitingCount || 1) - 1),
        updatedAt: now,
      });

      transaction.update(targetSessionRef, {
        waitingCount: (targetSession.waitingCount || 0) + 1,
        totalTokensIssued: (targetSession.totalTokensIssued || 0) + 1,
        updatedAt: now,
      });

      transaction.update(recRef, {
        status: "applied",
        appliedAt: now,
        appliedBy: `${actorRole}:${actorId}`,
      });
    });

    // Operational event
    const eventId = `ev-rebal-${Date.now()}`;
    await db.doc(paths.operationalEvent(hospitalId, eventId)).set({
      id: eventId,
      hospitalId,
      departmentId: rec.departmentId,
      doctorId: targetDoctorId,
      sessionId: targetSessionId,
      queueEntryId,
      eventType: "room_reassigned",
      severity: "info",
      timestamp: now,
      actorRole,
      description: `Recommendation applied: Queue entry reassigned to Dr. ${targetDoctorName} (Room ${targetRoomNumber}) to balance OPD workload.`,
      metadata: { recommendationId },
    });

    // Recalculate predictions asynchronously for both sessions
    await Promise.all([
      calculateQueuePredictions(hospitalId, sourceSessionId).catch(() => []),
      calculateQueuePredictions(hospitalId, targetSessionId).catch(() => []),
    ]);
  } else {
    // For general recommendations, update status
    await recRef.update({
      status: "applied",
      appliedAt: now,
      appliedBy: `${actorRole}:${actorId}`,
    });
  }

  const updatedSnap = await recRef.get();
  return updatedSnap.data() as Recommendation;
}

/**
 * Dismiss a recommendation without applying.
 */
export async function dismissRecommendation(
  hospitalId: string,
  recommendationId: string
): Promise<Recommendation> {
  const db = getAdminFirestore();
  const recRef = db.doc(paths.recommendation(hospitalId, recommendationId));
  const recSnap = await recRef.get();

  if (!recSnap.exists) {
    throw new Error(`Recommendation '${recommendationId}' not found.`);
  }

  const now = nowTimestamp();
  await recRef.update({
    status: "dismissed",
    updatedAt: now,
  });

  const updatedSnap = await recRef.get();
  return updatedSnap.data() as Recommendation;
}

/**
 * List recommendations for a hospital with optional status and department filters.
 */
export async function getRecommendations(
  hospitalId: string,
  filter?: { departmentId?: string; status?: RecommendationStatus }
): Promise<Recommendation[]> {
  const db = getAdminFirestore();

  let query: FirebaseFirestore.Query = db.collection(paths.recommendations(hospitalId));

  if (filter?.departmentId) {
    query = query.where("departmentId", "==", filter.departmentId);
  }
  if (filter?.status) {
    query = query.where("status", "==", filter.status);
  }

  const snap = await query.limit(50).get();
  const recs: Recommendation[] = [];
  snap.forEach((doc) => recs.push(doc.data() as Recommendation));

  // Sort: pending first, then by createdAt desc
  return recs.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return 0;
  });
}
