import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";
import { createSession } from "@/features/sessions/services/sessions.server";
import { createQueueEntry } from "@/features/queue/services/queue.server";
import { getPatientTrackingInfo } from "@/features/tracker/services/tracker.server";

describe("Phase 7: Patient Experience & Secure Token Tracker", () => {
  const db = getAdminFirestore();
  const timestamp = Date.now().toString().slice(-6);
  const testSessionId = `ses-trk-${timestamp}`;
  const testDoctorId = "doc-gm-01";
  const testDeptId = "dept-gm";

  const createdEntryIds: string[] = [];
  let testTokenDisplay = "";

  beforeAll(async () => {
    // 1. Create active session
    await createSession(SEED_HOSPITAL_ID, {
      id: testSessionId,
      doctorId: testDoctorId,
      departmentId: testDeptId,
      date: "2026-11-20",
      startTime: "09:00",
      endTime: "13:00",
      roomNumber: "101-T",
      status: "active",
    });

    // 2. Create queue entry
    const entry = await createQueueEntry(SEED_HOSPITAL_ID, {
      sessionId: testSessionId,
      patientId: "pat-0001",
      priority: "normal",
      notes: "CONFIDENTIAL_CLINICAL_INTERNAL_NOTE_12345",
    });
    createdEntryIds.push(entry.id);
    testTokenDisplay = entry.tokenDisplay;
  }, 30000);

  afterAll(async () => {
    for (const id of createdEntryIds) {
      await db.doc(paths.queueEntry(SEED_HOSPITAL_ID, id)).delete().catch(() => {});
      await db.doc(paths.prediction(SEED_HOSPITAL_ID, `pred-${id}`)).delete().catch(() => {});
    }
    await db.doc(paths.session(SEED_HOSPITAL_ID, testSessionId)).delete().catch(() => {});
  }, 30000);

  it("retrieves live tracking information by token display string", async () => {
    const info = await getPatientTrackingInfo(SEED_HOSPITAL_ID, {
      tokenDisplay: testTokenDisplay,
    });

    expect(info).not.toBeNull();
    expect(info?.tokenDisplay).toBe(testTokenDisplay);
    expect(info?.roomNumber).toBe("101-T");
    expect(info?.status).toBe("waiting");
    expect(info?.positionInQueue).toBe(1);
    expect(info?.notifyApproach).toBe(true); // Position 1 is <= 3
  });

  it("enforces strict privacy boundary without leaking internal notes or full UHID", async () => {
    const info = await getPatientTrackingInfo(SEED_HOSPITAL_ID, {
      tokenDisplay: testTokenDisplay,
    });

    expect(info).not.toBeNull();
    // Verify masked UHID
    expect(info?.uhidMasked).toContain("****");
    // Verify confidential clinical notes are NOT exposed in public tracking info
    expect((info as unknown as Record<string, unknown>).notes).toBeUndefined();
    // Verify internal raw patient ID is not exposed
    expect((info as unknown as Record<string, unknown>).patientId).toBeUndefined();
  });

  it("returns null for nonexistent token", async () => {
    const info = await getPatientTrackingInfo(SEED_HOSPITAL_ID, {
      tokenDisplay: "INVALID-9999",
    });

    expect(info).toBeNull();
  });
});
