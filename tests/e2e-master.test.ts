import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";

// Domain Services across Phases 1-8
import { createSession } from "@/features/sessions/services/sessions.server";
import { createPatient } from "@/features/patients/services/patients.server";
import {
  createAppointment,
  checkInAppointment,
} from "@/features/appointments/services/appointments.server";
import {
  getSessionQueueState,
  createQueueEntry,
  callNextPatient,
  startConsultation,
  completeConsultation,
} from "@/features/queue/services/queue.server";
import {
  calculateQueuePredictions,
  recordConsultationActualWait,
} from "@/features/predictions/services/predictions.server";
import { getPatientTrackingInfo } from "@/features/tracker/services/tracker.server";
import { getHospitalAnalyticsSummary } from "@/features/analytics/services/analytics.server";

describe("QueueX Master E2E Integration Workflow (Phases 1 through 8)", () => {
  const db = getAdminFirestore();
  const timestamp = Date.now().toString().slice(-6);

  const testSessionId = `ses-master-${timestamp}`;
  const testDoctorId = "doc-gm-01"; // Dr. Rajesh Kumar
  const testDeptId = "dept-gm"; // General Medicine

  let registeredPatientId: string;
  let bookedAppointmentId: string;
  let regularEntryId: string;
  let regularTokenDisplay: string;
  let emergencyEntryId: string;
  let completedConsultationId: string;

  beforeAll(async () => {
    // Initialize dedicated active OPD session for master workflow
    await createSession(SEED_HOSPITAL_ID, {
      id: testSessionId,
      doctorId: testDoctorId,
      departmentId: testDeptId,
      date: "2026-11-20",
      startTime: "09:00",
      endTime: "13:00",
      roomNumber: "101-M",
      status: "active",
    });
  }, 30000);

  afterAll(async () => {
    // Systematic clean up
    if (completedConsultationId) {
      await db.doc(paths.consultation(SEED_HOSPITAL_ID, completedConsultationId)).delete().catch(() => {});
    }
    if (emergencyEntryId) {
      await db.doc(paths.queueEntry(SEED_HOSPITAL_ID, emergencyEntryId)).delete().catch(() => {});
      await db.doc(paths.prediction(SEED_HOSPITAL_ID, `pred-${emergencyEntryId}`)).delete().catch(() => {});
    }
    if (regularEntryId) {
      await db.doc(paths.queueEntry(SEED_HOSPITAL_ID, regularEntryId)).delete().catch(() => {});
      await db.doc(paths.prediction(SEED_HOSPITAL_ID, `pred-${regularEntryId}`)).delete().catch(() => {});
    }
    if (bookedAppointmentId) {
      await db.doc(paths.appointment(SEED_HOSPITAL_ID, bookedAppointmentId)).delete().catch(() => {});
    }
    if (registeredPatientId) {
      await db.doc(paths.patient(SEED_HOSPITAL_ID, registeredPatientId)).delete().catch(() => {});
    }
    await db.doc(paths.session(SEED_HOSPITAL_ID, testSessionId)).delete().catch(() => {});
  }, 30000);

  // Step 1: Patient Registration
  it("Step 1: Registers a new patient and assigns an immutable UHID", async () => {
    const patient = await createPatient(SEED_HOSPITAL_ID, {
      name: `Master Test Patient ${timestamp}`,
      phone: `98765${timestamp.slice(-5)}`,
      gender: "male",
      age: 38,
    });

    expect(patient.id).toBeDefined();
    expect(patient.uhid).toMatch(/^QX-\d{4}-\d{4}$/);
    registeredPatientId = patient.id;
  });

  // Step 2: Appointment Booking
  it("Step 2: Books an appointment respecting doctor schedule shifts and slot duration", async () => {
    const appointment = await createAppointment(SEED_HOSPITAL_ID, {
      patientId: registeredPatientId,
      doctorId: testDoctorId,
      scheduledDate: "2026-11-20",
      scheduledTime: "09:30",
      appointmentType: "regular",
      notes: "Routine hypertension follow-up",
    });

    expect(appointment.id).toBeDefined();
    expect(appointment.status).toBe("booked");
    expect(appointment.scheduledTime).toBe("09:30");
    bookedAppointmentId = appointment.id;
  });

  // Step 3: Check-in & Queue Token Issuance
  it("Step 3: Checks in appointment at clinic reception and issues unique digital queue token", async () => {
    const checkedIn = await checkInAppointment(
      SEED_HOSPITAL_ID,
      bookedAppointmentId
    );
    expect(checkedIn.status).toBe("checked_in");

    const entry = await createQueueEntry(SEED_HOSPITAL_ID, {
      sessionId: testSessionId,
      patientId: registeredPatientId,
      appointmentId: bookedAppointmentId,
      priority: "normal",
    });

    expect(entry).toBeDefined();
    expect(entry.tokenNumber).toBe(1);
    expect(entry.tokenDisplay).toContain("001");
    expect(entry.status).toBe("waiting");

    regularEntryId = entry.id;
    regularTokenDisplay = entry.tokenDisplay;
  });

  // Step 4: Predictive Waiting Time & Approaching Turn Alert
  it("Step 4: Calculates real-time wait prediction and flags approaching turn (position <= 3)", async () => {
    const predictions = await calculateQueuePredictions(SEED_HOSPITAL_ID, testSessionId);

    expect(predictions.length).toBe(1);
    const pred = predictions[0];
    expect(pred.queueEntryId).toBe(regularEntryId);
    expect(pred.patientPosition).toBe(1);
    expect(pred.notifyApproach).toBe(true);
    expect(pred.targetValue).toBeGreaterThan(0);
  });

  // Step 5: Emergency Priority Triage Override
  it("Step 5: Enters an emergency trauma case and verifies priority queue preemption", async () => {
    const emergency = await createQueueEntry(SEED_HOSPITAL_ID, {
      sessionId: testSessionId,
      patientId: "pat-0002",
      priority: "emergency",
      notes: "Severe trauma from vehicle collision",
    });

    emergencyEntryId = emergency.id;
    expect(emergency.priority).toBe("emergency");

    // Queue state should now reflect emergency patient at position #1
    const state = await getSessionQueueState(SEED_HOSPITAL_ID, testSessionId);
    expect(state.waitingQueue[0].id).toBe(emergencyEntryId);
    expect(state.waitingQueue[0].priority).toBe("emergency");
    expect(state.waitingQueue[1].id).toBe(regularEntryId);

    // Dynamic queue recalculation with emergency triage priority
    const emergencyPredictions = await calculateQueuePredictions(SEED_HOSPITAL_ID, testSessionId);
    expect(emergencyPredictions.length).toBe(2);
    expect(emergencyPredictions[0].queueEntryId).toBe(emergencyEntryId);
    expect(emergencyPredictions[0].patientPosition).toBe(1);
  });

  // Step 6: Priority Dispatch Call Next
  it("Step 6: Calls the next patient in priority order (Emergency first)", async () => {
    const called = await callNextPatient(SEED_HOSPITAL_ID, testSessionId);

    expect(called.id).toBe(emergencyEntryId);
    expect(called.status).toBe("called");
    expect(called.priority).toBe("emergency");
  });

  // Step 7: Start Consultation & Lock Concurrent Doctor Consultations
  it("Step 7: Starts consultation and prevents concurrent consultation overlap", async () => {
    const started = await startConsultation(SEED_HOSPITAL_ID, emergencyEntryId);
    expect(started.status).toBe("in_consultation");
    expect(started.consultationStartedAt).toBeDefined();

    // Verifies concurrent consultation lock
    await expect(
      startConsultation(SEED_HOSPITAL_ID, regularEntryId)
    ).rejects.toThrow(/active consultation in progress/i);
  });

  // Step 8: Complete Consultation & Generate Immutable Historical Record
  it("Step 8: Completes consultation, creates consultation document, and updates session counts", async () => {
    const result = await completeConsultation(SEED_HOSPITAL_ID, emergencyEntryId, {
      outcome: "prescribed",
      notes: "Emergency stabilization successful. Prescribed analgesics.",
    });

    expect(result.entry.status).toBe("completed");
    expect(result.consultation.id).toBeDefined();
    expect(result.consultation.outcome).toBe("prescribed");
    expect(result.consultation.durationSeconds).toBeGreaterThan(0);
    completedConsultationId = result.consultation.id;

    // Verify session counters
    const sessionSnap = await db.doc(paths.session(SEED_HOSPITAL_ID, testSessionId)).get();
    expect(sessionSnap.data()!.completedCount).toBeGreaterThanOrEqual(1);
  });

  // Step 9: Prediction Accuracy & MAE Recording
  it("Step 9: Records empirical consultation wait duration and updates accuracy tracking", async () => {
    const actualWait = await recordConsultationActualWait(
      SEED_HOSPITAL_ID,
      emergencyEntryId,
      new Date(Date.now() + 10 * 60 * 1000)
    );

    expect(actualWait).not.toBeNull();
    expect(actualWait?.actualWaitMinutes).toBeDefined();
    expect(actualWait?.absoluteErrorMinutes).toBeDefined();
  });

  // Step 10: Patient Experience Tracker & Master Analytics Validation
  it("Step 10: Validates privacy-preserving patient tracker and updated operational analytics", async () => {
    // 10a: Validate public patient tracker
    const trackerInfo = await getPatientTrackingInfo(SEED_HOSPITAL_ID, {
      tokenDisplay: regularTokenDisplay,
    });
    expect(trackerInfo).not.toBeNull();
    expect(trackerInfo?.tokenDisplay).toBe(regularTokenDisplay);
    expect(trackerInfo?.roomNumber).toBe("101-M");
    expect(trackerInfo?.status).toBe("waiting");
    expect(trackerInfo?.uhidMasked).toContain("****");

    // 10b: Validate hospital operational analytics
    const analytics = await getHospitalAnalyticsSummary(SEED_HOSPITAL_ID);
    expect(analytics.hospitalId).toBe(SEED_HOSPITAL_ID);
    expect(analytics.totalConsultationsCompleted).toBeGreaterThanOrEqual(1);
    expect(analytics.baselineComparison.length).toBeGreaterThanOrEqual(4);
  });
});
