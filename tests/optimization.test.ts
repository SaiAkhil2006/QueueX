import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";
import { createSession } from "@/features/sessions/services/sessions.server";
import { createQueueEntry } from "@/features/queue/services/queue.server";
import {
  analyzeDepartmentWorkload,
  generateRecommendations,
  applyRecommendation,
  dismissRecommendation,
  getRecommendations,
} from "@/features/optimization/services/optimization.server";

describe("Phase 5: Dynamic Operational Optimization & Bottleneck Recommendations", () => {
  const db = getAdminFirestore();
  const timestamp = Date.now().toString().slice(-6);
  const sessionAId = `ses-optA-${timestamp}`;
  const sessionBId = `ses-optB-${timestamp}`;
  const testDoctorAId = "doc-gm-01"; // Dr. Rajesh Kumar
  const testDoctorBId = "doc-gm-02"; // Dr. Priya Sharma
  const testDeptId = "dept-gm";

  const createdEntryIds: string[] = [];
  const createdRecIds: string[] = [];

  beforeAll(async () => {
    // 1. Create two parallel active sessions in General Medicine
    await createSession(SEED_HOSPITAL_ID, {
      id: sessionAId,
      doctorId: testDoctorAId,
      departmentId: testDeptId,
      date: "2026-11-20",
      startTime: "09:00",
      endTime: "13:00",
      roomNumber: "101-A",
      status: "active",
    });

    await createSession(SEED_HOSPITAL_ID, {
      id: sessionBId,
      doctorId: testDoctorBId,
      departmentId: testDeptId,
      date: "2026-11-20",
      startTime: "09:00",
      endTime: "13:00",
      roomNumber: "102-B",
      status: "active",
    });

    // 2. Create intentional imbalance: Doctor A has 4 patients, Doctor B has 0 patients
    for (let i = 1; i <= 4; i++) {
      const entry = await createQueueEntry(SEED_HOSPITAL_ID, {
        sessionId: sessionAId,
        patientId: `pat-000${i}`,
        priority: "normal",
      });
      createdEntryIds.push(entry.id);
    }
  }, 30000);

  afterAll(async () => {
    // Cleanup queue entries, recommendations, sessions
    for (const id of createdEntryIds) {
      await db.doc(paths.queueEntry(SEED_HOSPITAL_ID, id)).delete().catch(() => {});
      await db.doc(paths.prediction(SEED_HOSPITAL_ID, `pred-${id}`)).delete().catch(() => {});
    }
    for (const id of createdRecIds) {
      await db.doc(paths.recommendation(SEED_HOSPITAL_ID, id)).delete().catch(() => {});
    }
    await db.doc(paths.session(SEED_HOSPITAL_ID, sessionAId)).delete().catch(() => {});
    await db.doc(paths.session(SEED_HOSPITAL_ID, sessionBId)).delete().catch(() => {});
  }, 30000);

  describe("Workload Analysis Engine", () => {
    it("accurately detects queue imbalance between peer physicians in the same department", async () => {
      const workload = await analyzeDepartmentWorkload(SEED_HOSPITAL_ID, testDeptId);

      expect(workload.departmentId).toBe(testDeptId);
      expect(workload.activeSessions.length).toBeGreaterThanOrEqual(2);
      expect(workload.hasImbalance).toBe(true);
      expect(workload.imbalanceDelta).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Prescriptive Recommendation Engine", () => {
    let generatedRecId: string;

    it("generates a queue rebalance recommendation proposing patient transfer", async () => {
      const recs = await generateRecommendations(SEED_HOSPITAL_ID, testDeptId);

      expect(recs.length).toBeGreaterThan(0);
      const rebalanceRec = recs.find((r) => r.type === "rebalance_queue");
      expect(rebalanceRec).toBeDefined();
      expect(rebalanceRec?.status).toBe("pending");
      expect(rebalanceRec?.actionPayload.sourceSessionId).toBe(sessionAId);
      expect(rebalanceRec?.actionPayload.targetSessionId).toBe(sessionBId);

      generatedRecId = rebalanceRec!.id;
      createdRecIds.push(generatedRecId);
    });

    it("executes human-in-the-loop recommendation and reassigns patient to target physician", async () => {
      const applied = await applyRecommendation(
        SEED_HOSPITAL_ID,
        generatedRecId,
        "supervisor",
        "nurse-lead"
      );

      expect(applied.status).toBe("applied");
      expect(applied.appliedAt).toBeDefined();

      // Verify the transferred patient's queue entry was moved to session B
      const targetEntryId = applied.actionPayload.queueEntryId as string;
      const entrySnap = await db.doc(paths.queueEntry(SEED_HOSPITAL_ID, targetEntryId)).get();
      expect(entrySnap.exists).toBe(true);
      const entryData = entrySnap.data()!;
      expect(entryData.sessionId).toBe(sessionBId);
      expect(entryData.doctorId).toBe(testDoctorBId);

      // Verify session counts updated
      const sessionASnap = await db.doc(paths.session(SEED_HOSPITAL_ID, sessionAId)).get();
      const sessionBSnap = await db.doc(paths.session(SEED_HOSPITAL_ID, sessionBId)).get();
      expect(sessionASnap.data()!.waitingCount).toBe(3);
      expect(sessionBSnap.data()!.waitingCount).toBe(1);
    });

    it("allows dismissing an unwanted recommendation", async () => {
      // Create a test recommendation
      const dismissRecId = `rec-dismiss-test-${timestamp}`;
      createdRecIds.push(dismissRecId);
      await db.doc(paths.recommendation(SEED_HOSPITAL_ID, dismissRecId)).set({
        id: dismissRecId,
        hospitalId: SEED_HOSPITAL_ID,
        departmentId: testDeptId,
        type: "extend_opd_hours",
        title: "Test Recommendation for Dismissal",
        description: "Test description",
        priority: "low",
        status: "pending",
        createdAt: new Date(),
        appliedAt: null,
        appliedBy: null,
      });

      const dismissed = await dismissRecommendation(SEED_HOSPITAL_ID, dismissRecId);
      expect(dismissed.status).toBe("dismissed");
    });

    it("queries recommendations with status filtering", async () => {
      const appliedList = await getRecommendations(SEED_HOSPITAL_ID, {
        departmentId: testDeptId,
        status: "applied",
      });

      expect(appliedList.some((r) => r.id === generatedRecId)).toBe(true);
    });
  });
});
