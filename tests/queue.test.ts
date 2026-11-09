import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";
import {
  getSessionQueueState,
  createQueueEntry,
  callNextPatient,
  startConsultation,
  completeConsultation,
  skipPatient,
  recallPatient,
  updateQueuePriority,
  sortWaitingQueue,
} from "@/features/queue/services/queue.server";
import { createSession } from "@/features/sessions/services/sessions.server";
import type { QueueEntry } from "@/types/queue";

describe("Phase 3: Smart Queue Engine & Consultation Lifecycle", () => {
  const db = getAdminFirestore();
  const timestamp = Date.now().toString().slice(-6);
  const testSessionId = `ses-qtest-${timestamp}`;
  const testDoctorId = "doc-gm-02"; // Dr. Priya Sharma
  const testDeptId = "dept-gm";
  const createdEntryIds: string[] = [];

  beforeAll(async () => {
    // Create dedicated active OPD session for queue testing
    await createSession(SEED_HOSPITAL_ID, {
      id: testSessionId,
      doctorId: testDoctorId,
      departmentId: testDeptId,
      date: "2026-11-20",
      startTime: "09:00",
      endTime: "13:00",
      roomNumber: "102-Q",
      status: "active",
    });
  });

  afterAll(async () => {
    // Clean up created queue entries and session
    for (const id of createdEntryIds) {
      await db.doc(paths.queueEntry(SEED_HOSPITAL_ID, id)).delete().catch(() => {});
    }
    await db.doc(paths.session(SEED_HOSPITAL_ID, testSessionId)).delete().catch(() => {});
  });

  describe("Unit: sortWaitingQueue priority rules", () => {
    it("places emergency cases first and preserves arrival FIFO within same priority", () => {
      const now = Date.now();
      const createMockTimestamp = (ms: number) =>
        ({
          seconds: Math.floor(ms / 1000),
          nanoseconds: 0,
          toDate: () => new Date(ms),
          toMillis: () => ms,
        }) as unknown as QueueEntry["arrivalTime"];

      const mockEntries: Partial<QueueEntry>[] = [
        {
          id: "1",
          tokenDisplay: "GM-001",
          priority: "normal",
          arrivalTime: createMockTimestamp(now + 1000),
        },
        {
          id: "2",
          tokenDisplay: "GM-002",
          priority: "priority",
          arrivalTime: createMockTimestamp(now + 2000),
        },
        {
          id: "3",
          tokenDisplay: "GM-003",
          priority: "emergency",
          arrivalTime: createMockTimestamp(now + 3000),
        },
        {
          id: "4",
          tokenDisplay: "GM-004",
          priority: "normal",
          arrivalTime: createMockTimestamp(now + 500),
        },
      ];

      const sorted = sortWaitingQueue(mockEntries as QueueEntry[]);
      expect(sorted[0].id).toBe("3"); // Emergency first
      expect(sorted[1].id).toBe("2"); // Priority second
      expect(sorted[2].id).toBe("4"); // Normal (earlier arrival)
      expect(sorted[3].id).toBe("1"); // Normal (later arrival)
    });
  });

  describe("Server Service: createQueueEntry & Duplicate Prevention", () => {
    it("issues a unique digital token and enters the waiting queue", async () => {
      const entry = await createQueueEntry(SEED_HOSPITAL_ID, {
        sessionId: testSessionId,
        patientId: "pat-0001",
        priority: "normal",
      });

      createdEntryIds.push(entry.id);
      expect(entry.id).toBeDefined();
      expect(entry.tokenNumber).toBe(1);
      expect(entry.tokenDisplay).toContain("001");
      expect(entry.status).toBe("waiting");
    });

    it("prevents duplicate active token for the same patient in the same session", async () => {
      await expect(
        createQueueEntry(SEED_HOSPITAL_ID, {
          sessionId: testSessionId,
          patientId: "pat-0001",
        })
      ).rejects.toThrow(/already has an active token/i);
    });

    it("issues a second token for another patient", async () => {
      const entry2 = await createQueueEntry(SEED_HOSPITAL_ID, {
        sessionId: testSessionId,
        patientId: "pat-0002",
        priority: "normal",
      });

      createdEntryIds.push(entry2.id);
      expect(entry2.tokenNumber).toBe(2);
      expect(entry2.tokenDisplay).toContain("002");
    });
  });

  describe("Server Service: Emergency Priority Override", () => {
    it("emergency token jumps straight to the front of the line", async () => {
      const emergencyEntry = await createQueueEntry(SEED_HOSPITAL_ID, {
        sessionId: testSessionId,
        patientId: "pat-0003",
        priority: "emergency",
        notes: "Acute trauma",
      });

      createdEntryIds.push(emergencyEntry.id);
      expect(emergencyEntry.priority).toBe("emergency");

      const state = await getSessionQueueState(SEED_HOSPITAL_ID, testSessionId);
      expect(state.waitingQueue[0].id).toBe(emergencyEntry.id);
      expect(state.waitingQueue[0].position).toBe(1);
    });

    it("dynamically modifies queue entry priority", async () => {
      const updated = await updateQueuePriority(
        SEED_HOSPITAL_ID,
        createdEntryIds[0],
        "priority",
        "Elderly patient needing assistance"
      );
      expect(updated.priority).toBe("priority");
      expect(updated.notes).toContain("Elderly");
    });
  });

  describe("Server Service: Full Consultation Lifecycle Workflow", () => {
    let calledEntryId: string;

    it("calls the highest priority waiting patient", async () => {
      const called = await callNextPatient(SEED_HOSPITAL_ID, testSessionId);
      expect(called.status).toBe("called");
      expect(called.priority).toBe("emergency"); // Called the emergency patient
      calledEntryId = called.id;
    });

    it("starts consultation for the called patient", async () => {
      const inConsult = await startConsultation(SEED_HOSPITAL_ID, calledEntryId);
      expect(inConsult.status).toBe("in_consultation");
      expect(inConsult.consultationStartedAt).toBeDefined();
    });

    it("blocks starting a second concurrent consultation for the same doctor", async () => {
      // Find another waiting entry
      const state = await getSessionQueueState(SEED_HOSPITAL_ID, testSessionId);
      const nextWaiting = state.waitingQueue[0];
      expect(nextWaiting).toBeDefined();

      await expect(
        startConsultation(SEED_HOSPITAL_ID, nextWaiting.id)
      ).rejects.toThrow(/active consultation in progress/i);
    });

    it("completes consultation and generates immutable historical record", async () => {
      const result = await completeConsultation(SEED_HOSPITAL_ID, calledEntryId, {
        outcome: "routine_clear",
        notes: "Patient stabilized, vitals normal",
      });

      expect(result.entry.status).toBe("completed");
      expect(result.consultation.id).toBeDefined();
      expect(result.consultation.outcome).toBe("routine_clear");
      expect(result.consultation.durationSeconds).toBeGreaterThanOrEqual(60);

      // Clean up consultation record
      await db.doc(paths.consultation(SEED_HOSPITAL_ID, result.consultation.id)).delete().catch(() => {});
    });
  });

  describe("Server Service: Skip and Recall Workflow", () => {
    it("calls, skips, and successfully recalls a patient", async () => {
      // 1. Call next patient (pat-0001)
      const called = await callNextPatient(SEED_HOSPITAL_ID, testSessionId);
      expect(called.status).toBe("called");

      // 2. Patient did not show up -> skip
      const skipped = await skipPatient(SEED_HOSPITAL_ID, called.id);
      expect(skipped.status).toBe("skipped");

      // Verify patient is in skippedQueue
      let state = await getSessionQueueState(SEED_HOSPITAL_ID, testSessionId);
      expect(state.skippedQueue.some((e) => e.id === called.id)).toBe(true);

      // 3. Recall patient back to waiting line
      const recalled = await recallPatient(SEED_HOSPITAL_ID, called.id);
      expect(recalled.status).toBe("waiting");

      // Verify patient is back in waitingQueue
      state = await getSessionQueueState(SEED_HOSPITAL_ID, testSessionId);
      expect(state.waitingQueue.some((e) => e.id === called.id)).toBe(true);
    });
  });
});
