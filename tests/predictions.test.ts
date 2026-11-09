import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";
import { createSession } from "@/features/sessions/services/sessions.server";
import { createQueueEntry } from "@/features/queue/services/queue.server";
import {
  getDoctorDurationStats,
  calculateQueuePredictions,
  recordConsultationActualWait,
  getHospitalPredictionMetrics,
  getPredictions,
} from "@/features/predictions/services/predictions.server";
import { nowTimestamp } from "@/lib/firebase/server-timestamps";

describe("Phase 4: Waiting-Time Intelligence & Delay Propagation", () => {
  const db = getAdminFirestore();
  const timestamp = Date.now().toString().slice(-6);
  const testSessionId = `ses-pred-${timestamp}`;
  const testDoctorId = "doc-gm-01"; // Dr. Rajesh Kumar
  const testDeptId = "dept-gm";
  const createdEntryIds: string[] = [];
  const createdPredictionIds: string[] = [];

  beforeAll(async () => {
    // Create dedicated active session
    await createSession(SEED_HOSPITAL_ID, {
      id: testSessionId,
      doctorId: testDoctorId,
      departmentId: testDeptId,
      date: "2026-11-20",
      startTime: "08:00",
      endTime: "12:00",
      roomNumber: "101-P",
      status: "active",
    });

    // Populate a sample completed consultation to give historical signal
    const sampleConsultId = `cst-test-${timestamp}`;
    await db.doc(paths.consultation(SEED_HOSPITAL_ID, sampleConsultId)).set({
      id: sampleConsultId,
      hospitalId: SEED_HOSPITAL_ID,
      departmentId: testDeptId,
      doctorId: testDoctorId,
      sessionId: testSessionId,
      queueEntryId: `qe-dummy-${timestamp}`,
      patientId: "pat-0001",
      tokenNumber: 99,
      tokenDisplay: "GM-099",
      startedAt: nowTimestamp(),
      completedAt: nowTimestamp(),
      durationSeconds: 720, // 12 minutes
      status: "completed",
      outcome: "prescribed",
      notes: "Follow-up check completed",
      prescriptions: [],
      createdAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
    });
  });

  afterAll(async () => {
    // Cleanup queue entries, predictions, session
    for (const id of createdEntryIds) {
      await db.doc(paths.queueEntry(SEED_HOSPITAL_ID, id)).delete().catch(() => {});
      await db.doc(paths.prediction(SEED_HOSPITAL_ID, `pred-${id}`)).delete().catch(() => {});
    }
    for (const id of createdPredictionIds) {
      await db.doc(paths.prediction(SEED_HOSPITAL_ID, id)).delete().catch(() => {});
    }
    await db.doc(paths.session(SEED_HOSPITAL_ID, testSessionId)).delete().catch(() => {});
  });

  describe("Historical Duration Statistics Engine", () => {
    it("computes empirical duration mean and variance from completed consultations", async () => {
      const stats = await getDoctorDurationStats(
        SEED_HOSPITAL_ID,
        testDoctorId,
        testDeptId
      );

      expect(stats.doctorId).toBe(testDoctorId);
      expect(stats.sampleCount).toBeGreaterThan(0);
      expect(stats.meanDurationMinutes).toBeGreaterThan(0);
      expect(stats.baselineMinutes).toBeGreaterThan(0);
      expect(["low", "medium", "high"]).toContain(stats.confidenceLevel);
    });
  });

  describe("Queue Predictions & Dynamic ETA Engine", () => {
    it("generates cumulative ETAs and marks first 3 patients for turn approach", async () => {
      // Add 4 patients to queue
      for (let i = 1; i <= 4; i++) {
        const entry = await createQueueEntry(SEED_HOSPITAL_ID, {
          sessionId: testSessionId,
          patientId: `pat-000${i}`,
          priority: "normal",
        });
        createdEntryIds.push(entry.id);
      }

      // Calculate predictions
      const predictions = await calculateQueuePredictions(
        SEED_HOSPITAL_ID,
        testSessionId
      );

      expect(predictions.length).toBe(4);

      // Verify position and approaching flag
      expect(predictions[0].patientPosition).toBe(1);
      expect(predictions[0].notifyApproach).toBe(true);

      expect(predictions[1].patientPosition).toBe(2);
      expect(predictions[1].notifyApproach).toBe(true);

      expect(predictions[2].patientPosition).toBe(3);
      expect(predictions[2].notifyApproach).toBe(true);

      expect(predictions[3].patientPosition).toBe(4);
      expect(predictions[3].notifyApproach).toBe(false); // 4th is NOT <= 3

      // Monotonically increasing wait times
      expect(predictions[0].targetValue).toBeLessThan(predictions[1].targetValue);
      expect(predictions[1].targetValue).toBeLessThan(predictions[2].targetValue);
      expect(predictions[2].targetValue).toBeLessThan(predictions[3].targetValue);

      // Verify contributing factors breakdown
      expect(predictions[1].contributingFactors.length).toBeGreaterThan(0);
    });

    it("expedites emergency patient ETA ahead of normal queue line", async () => {
      const emergency = await createQueueEntry(SEED_HOSPITAL_ID, {
        sessionId: testSessionId,
        patientId: "pat-0005",
        priority: "emergency",
      });
      createdEntryIds.push(emergency.id);

      const predictions = await calculateQueuePredictions(
        SEED_HOSPITAL_ID,
        testSessionId
      );

      // Emergency patient should be position 1 with minimal wait time
      const emergencyPred = predictions.find((p) => p.queueEntryId === emergency.id);
      expect(emergencyPred).toBeDefined();
      expect(emergencyPred?.patientPosition).toBe(1);
      expect(emergencyPred?.notifyApproach).toBe(true);
    });
  });

  describe("Prediction Accuracy Tracking & MAE Evaluation", () => {
    it("records actual consultation wait time and calculates absolute error", async () => {
      const targetEntryId = createdEntryIds[0];
      const consultStart = new Date(Date.now() + 15 * 60 * 1000); // 15 min wait

      const updatedPred = await recordConsultationActualWait(
        SEED_HOSPITAL_ID,
        targetEntryId,
        consultStart
      );

      expect(updatedPred).toBeDefined();
      expect(updatedPred?.actualWaitMinutes).toBeDefined();
      expect(updatedPred?.absoluteErrorMinutes).toBeDefined();
      expect(typeof updatedPred?.absoluteErrorMinutes).toBe("number");
    });

    it("aggregates hospital prediction accuracy metrics", async () => {
      const metrics = await getHospitalPredictionMetrics(SEED_HOSPITAL_ID);

      expect(metrics.totalPredictions).toBeGreaterThan(0);
      expect(typeof metrics.meanAbsoluteErrorMinutes).toBe("number");
      expect(typeof metrics.accuracyWithin5MinPercent).toBe("number");
    });

    it("lists predictions with session filtering", async () => {
      const list = await getPredictions(SEED_HOSPITAL_ID, { sessionId: testSessionId });
      expect(list.length).toBeGreaterThan(0);
      expect(list[0].sessionId).toBe(testSessionId);
    });
  });
});
