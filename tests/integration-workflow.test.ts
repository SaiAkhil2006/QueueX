import { describe, it, expect, afterAll } from "vitest";
import {
  getHospitalById,
  updateHospitalById,
} from "@/features/hospital/services/hospital.server";
import { createDepartment } from "@/features/departments/services/departments.server";
import { createDoctor } from "@/features/doctors/services/doctors.server";
import {
  createOrUpdateDoctorSchedule,
} from "@/features/schedules/services/schedules.server";
import {
  createSession,
  transitionSession,
  getOperationalEvents,
} from "@/features/sessions/services/sessions.server";
import { getStaffDashboardData } from "@/features/dashboard/services/dashboard.server";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";

describe("Phase 1: Full End-to-End Operational Workflow Integration", () => {
  const timestamp = Date.now().toString().slice(-5);
  const testDeptId = `dept-workflow-${timestamp}`;
  const testDoctorId = `doc-workflow-${timestamp}`;
  const testSessionId = `ses-workflow-${timestamp}`;
  const createdEventIds: string[] = [];

  const today = new Date();
  const testDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (testDate.getDay() === 0) testDate.setDate(testDate.getDate() + 1);
  const dateStr = testDate.toISOString().slice(0, 10);

  afterAll(async () => {
    const db = getAdminFirestore();
    await db.doc(paths.session(SEED_HOSPITAL_ID, testSessionId)).delete().catch(() => {});
    await db.doc(paths.schedule(SEED_HOSPITAL_ID, `sch-${testDoctorId}`)).delete().catch(() => {});
    await db.doc(paths.doctor(SEED_HOSPITAL_ID, testDoctorId)).delete().catch(() => {});
    await db.doc(paths.department(SEED_HOSPITAL_ID, testDeptId)).delete().catch(() => {});

    for (const eid of createdEventIds) {
      await db.doc(paths.operationalEvent(SEED_HOSPITAL_ID, eid)).delete().catch(() => {});
    }
  });

  it("executes the complete 13-step Phase 1 hospital and OPD management workflow", async () => {
    // 1. Open the hospital configuration
    const hospital = await getHospitalById(SEED_HOSPITAL_ID);
    expect(hospital).toBeDefined();
    expect(hospital?.id).toBe(SEED_HOSPITAL_ID);

    // 2. Edit hospital information
    const originalPhone = hospital?.phone || "+91 891 255 1234";
    const updatedHospital = await updateHospitalById(SEED_HOSPITAL_ID, {
      phone: "+91 891 255 9999",
    });
    expect(updatedHospital.phone).toBe("+91 891 255 9999");
    // Restore phone
    await updateHospitalById(SEED_HOSPITAL_ID, { phone: originalPhone });

    // 3. Create a department
    const department = await createDepartment(SEED_HOSPITAL_ID, {
      id: testDeptId,
      name: `Neurology Ops ${timestamp}`,
      code: `NEU${timestamp.slice(-2)}`,
      description: "Neurological consultations and brain health OPD",
      status: "active",
      floor: "5th Floor",
      buildingWing: "West Wing",
      avgConsultationDurationMinutes: 15,
    });
    expect(department.id).toBe(testDeptId);
    expect(department.status).toBe("active");

    // 4. Register a doctor in that department
    const doctor = await createDoctor(SEED_HOSPITAL_ID, {
      id: testDoctorId,
      name: `Dr. Arvind Sharma ${timestamp}`,
      departmentId: testDeptId,
      qualification: "MBBS, MD, DM (Neurology)",
      specialization: "Clinical Neurology & Epilepsy",
      roomNumber: "501",
      consultationDurationEstimate: 20,
      phone: "+91 891 555 0101",
      email: `arvind.${timestamp}@visakhahospital.org`,
      status: "active",
      availability: "available",
    });
    expect(doctor.id).toBe(testDoctorId);
    expect(doctor.departmentId).toBe(testDeptId);

    // 5. Configure the doctor's weekly schedule
    const schedule = await createOrUpdateDoctorSchedule(
      SEED_HOSPITAL_ID,
      testDoctorId,
      {
        startTime: "09:00",
        endTime: "17:00",
        maxPatientsPerSession: 30,
        workingDays: [0, 1, 2, 3, 4, 5, 6],
        breakPeriods: [
          { label: "Lunch", startTime: "13:00", endTime: "14:00" },
        ],
        isActive: true,
      }
    );
    expect(schedule.doctorId).toBe(testDoctorId);
    expect(schedule.isActive).toBe(true);

    // 6. Create an OPD session
    const session = await createSession(SEED_HOSPITAL_ID, {
      id: testSessionId,
      departmentId: testDeptId,
      doctorId: testDoctorId,
      roomNumber: "501",
      date: dateStr,
      startTime: "09:00",
      endTime: "13:00",
    });
    expect(session.id).toBe(testSessionId);
    expect(session.status).toBe("scheduled");

    // 7. Start the session
    const startResult = await transitionSession(
      SEED_HOSPITAL_ID,
      testSessionId,
      {
        action: "start",
        actorRole: "doctor",
        reason: "Doctor arrived at Room 501",
      }
    );
    expect(startResult.session.status).toBe("active");
    expect(startResult.session.startedAt).toBeTruthy();
    createdEventIds.push(startResult.eventId);

    // 8. Pause the session
    const pauseResult = await transitionSession(
      SEED_HOSPITAL_ID,
      testSessionId,
      {
        action: "pause",
        actorRole: "nurse",
        reason: "Emergency neurology trauma consultation",
      }
    );
    expect(pauseResult.session.status).toBe("paused");
    createdEventIds.push(pauseResult.eventId);

    // 9. Resume the session
    const resumeResult = await transitionSession(
      SEED_HOSPITAL_ID,
      testSessionId,
      {
        action: "resume",
        actorRole: "doctor",
        reason: "Trauma consultation concluded, resuming OPD queue",
      }
    );
    expect(resumeResult.session.status).toBe("active");
    createdEventIds.push(resumeResult.eventId);

    // 10. Complete the session
    const completeResult = await transitionSession(
      SEED_HOSPITAL_ID,
      testSessionId,
      {
        action: "complete",
        actorRole: "doctor",
        reason: "All neurological outpatient consultations concluded",
      }
    );
    expect(completeResult.session.status).toBe("completed");
    expect(completeResult.session.completedAt).toBeTruthy();
    createdEventIds.push(completeResult.eventId);

    // 11. Verify the operational events
    const events = await getOperationalEvents(SEED_HOSPITAL_ID, {
      sessionId: testSessionId,
    });
    expect(events.length).toBeGreaterThanOrEqual(4);
    const eventTypes = events.map((e) => e.eventType);
    expect(eventTypes).toContain("session_started");
    expect(eventTypes).toContain("session_paused");
    expect(eventTypes).toContain("session_resumed");
    expect(eventTypes).toContain("session_completed");

    // 12. Return to the staff dashboard
    const dashboard = await getStaffDashboardData(SEED_HOSPITAL_ID);
    expect(dashboard).toBeDefined();

    // 13. Verify that the dashboard reflects the latest operational state
    const foundDept = dashboard.departments.find((d) => d.id === testDeptId);
    expect(foundDept).toBeDefined();
    expect(foundDept?.assignedDoctorsCount).toBe(1);

    const foundDoctor = dashboard.doctors.find((d) => d.id === testDoctorId);
    expect(foundDoctor).toBeDefined();
    expect(foundDoctor?.departmentName).toContain("Neurology");

    const recentAudit = dashboard.recentEvents.some(
      (e) => e.sessionId === testSessionId
    );
    expect(recentAudit).toBe(true);
  }, 30000);
});
