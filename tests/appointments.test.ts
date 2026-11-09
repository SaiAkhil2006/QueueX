import { describe, it, expect, afterAll } from "vitest";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";
import {
  getAppointments,
  getAppointmentById,
  getAvailableSlots,
  createAppointment,
  createWalkInAppointment,
  cancelAppointment,
  rescheduleAppointment,
  checkInAppointment,
} from "@/features/appointments/services/appointments.server";

describe("Phase 2: Appointment Management & Slot Allocation", () => {
  const db = getAdminFirestore();
  const timestamp = Date.now().toString().slice(-6);
  const testAptId = `apt-test-${timestamp}`;
  const testWalkInId = `apt-walkin-test-${timestamp}`;
  const testPatientId = "pat-0001";
  const testDoctorId = "doc-gm-01"; // Dr. Rajesh Varma (General Medicine)
  const testDate = "2026-11-20"; // Future Friday

  afterAll(async () => {
    await db.doc(paths.appointment(SEED_HOSPITAL_ID, testAptId)).delete().catch(() => {});
    await db.doc(paths.appointment(SEED_HOSPITAL_ID, testWalkInId)).delete().catch(() => {});
  });

  describe("Server Service: getAppointments & getAppointmentById", () => {
    it("retrieves seeded appointments and queries by ID", async () => {
      const appointments = await getAppointments(SEED_HOSPITAL_ID, { limit: 10 });
      expect(appointments.length).toBeGreaterThan(0);
      const first = appointments[0];
      const single = await getAppointmentById(SEED_HOSPITAL_ID, first.id);
      expect(single).not.toBeNull();
      expect(single?.id).toBe(first.id);
    });
  });

  describe("Server Service: getAvailableSlots", () => {
    it("generates deterministic slots based on doctor shift and duration", async () => {
      const slots = await getAvailableSlots(SEED_HOSPITAL_ID, {
        doctorId: testDoctorId,
        date: testDate,
      });

      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].time).toBeDefined();
      expect(typeof slots[0].available).toBe("boolean");
      // Verify lunch break (13:00 to 14:00) is excluded
      const lunchSlot = slots.find((s) => s.time === "13:15" || s.time === "13:30");
      expect(lunchSlot).toBeUndefined();
    });
  });

  describe("Server Service: createAppointment & Conflict Detection", () => {
    it("successfully creates a new appointment", async () => {
      const created = await createAppointment(SEED_HOSPITAL_ID, {
        id: testAptId,
        patientId: testPatientId,
        doctorId: testDoctorId,
        scheduledDate: testDate,
        scheduledTime: "11:00",
        appointmentType: "regular",
        notes: "Routine health checkup",
      });

      expect(created.id).toBe(testAptId);
      expect(created.doctorId).toBe(testDoctorId);
      expect(created.status).toBe("booked");
      expect(created.scheduledTime).toBe("11:00");
    });

    it("prevents double-booking at the exact same slot for the same doctor", async () => {
      await expect(
        createAppointment(SEED_HOSPITAL_ID, {
          patientId: "pat-0002",
          doctorId: testDoctorId,
          scheduledDate: testDate,
          scheduledTime: "11:00",
          appointmentType: "regular",
        })
      ).rejects.toThrow(/conflicting booking/i);
    });
  });

  describe("Server Service: checkInAppointment", () => {
    it("transitions appointment status to checked_in", async () => {
      const updated = await checkInAppointment(SEED_HOSPITAL_ID, testAptId);
      expect(updated.status).toBe("checked_in");
    });
  });

  describe("Server Service: rescheduleAppointment", () => {
    it("reschedules appointment to a new open slot", async () => {
      const updated = await rescheduleAppointment(
        SEED_HOSPITAL_ID,
        testAptId,
        testDate,
        "11:30"
      );
      expect(updated.scheduledTime).toBe("11:30");
      expect(updated.status).toBe("booked");
    });
  });

  describe("Server Service: cancelAppointment", () => {
    it("cancels appointment with documented reason", async () => {
      const cancelled = await cancelAppointment(
        SEED_HOSPITAL_ID,
        testAptId,
        "Patient unable to attend"
      );
      expect(cancelled.status).toBe("cancelled");
      expect(cancelled.notes).toContain("Patient unable to attend");
    });
  });

  describe("Server Service: createWalkInAppointment", () => {
    it("creates an immediate walk-in appointment marked as checked_in", async () => {
      const walkIn = await createWalkInAppointment(SEED_HOSPITAL_ID, {
        patientId: "pat-0003",
        doctorId: testDoctorId,
        notes: "Urgent walk-in headache",
      });

      expect(walkIn.id).toBeDefined();
      expect(walkIn.appointmentType).toBe("walk_in");
      expect(walkIn.status).toBe("checked_in");

      // Clean up
      await db.doc(paths.appointment(SEED_HOSPITAL_ID, walkIn.id)).delete().catch(() => {});
    });
  });
});
