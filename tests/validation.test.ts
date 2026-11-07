import { describe, it, expect } from "vitest";
import {
  validate,
  validateOrThrow,
  ValidationError,
} from "@/lib/validation/validate";
import {
  createHospitalSchema,
  updateHospitalSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createDoctorSchema,
  updateDoctorSchema,
  createOPDSessionSchema,
  updateOPDSessionSchema,
  createPatientSchema,
  updatePatientSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  createQueueEntrySchema,
  updateQueueEntryStatusSchema,
  createConsultationSchema,
  createOperationalEventSchema,
  createPredictionSchema,
  createRecommendationSchema,
  updateRecommendationStatusSchema,
} from "@/schemas";
import {
  QUEUE_ENTRY_STATUSES,
  QUEUE_PRIORITIES,
  OPD_SESSION_STATUSES,
  APPOINTMENT_STATUSES,
  DOCTOR_STATUSES,
} from "@/constants";

describe("Validation Utility & Create/Update Schemas", () => {
  const now = new Date();

  describe("Validation Utility Helper", () => {
    it("returns success and typed data when input is valid", () => {
      const payload = {
        name: "Emergency Clinic",
        code: "EMRG",
        address: "Hospital Road",
        city: "Visakhapatnam",
        postalCode: "530002",
        phone: "+91 891 2222222",
        email: "emergency@hospital.org",
      };

      const result = validate(createHospitalSchema, payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe("EMRG");
        expect(result.data.configuration.emergencyWaitThresholdMinutes).toBe(10);
      }
    });

    it("returns formatted field errors without throwing when validation fails", () => {
      const invalidPayload = {
        name: "",
        code: "X", // too short
        email: "not-an-email",
        phone: "123", // too short
      };

      const result = validate(createHospitalSchema, invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThanOrEqual(4);
        expect(result.errorMessage).toContain("name");
        expect(result.errorMessage).toContain("email");
        expect(result.errors.some((e) => e.field === "code")).toBe(true);
      }
    });

    it("validateOrThrow throws ValidationError with 400 statusCode and error details", () => {
      expect(() =>
        validateOrThrow(createHospitalSchema, { name: "" })
      ).toThrowError(ValidationError);

      try {
        validateOrThrow(createHospitalSchema, { name: "" });
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        const valErr = err as ValidationError;
        expect(valErr.statusCode).toBe(400);
        expect(valErr.details.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Create vs Update Validation Schemas", () => {
    it("allows creating a hospital without id and timestamps", () => {
      const hospitalInput = {
        name: "Vizag Care Hospital",
        code: "VZG-CARE",
        address: "Daba Gardens",
        city: "Visakhapatnam",
        postalCode: "530020",
        phone: "+91 891 2345678",
        email: "care@vizagcare.in",
      };

      const result = createHospitalSchema.safeParse(hospitalInput);
      expect(result.success).toBe(true);
    });

    it("allows updating a hospital with partial attributes", () => {
      const updatePayload = {
        phone: "+91 891 9999999",
        status: "maintenance" as const,
      };

      const result = updateHospitalSchema.safeParse(updatePayload);
      expect(result.success).toBe(true);
    });

    it("validates patient creation and partial updates", () => {
      const newPatient = {
        hospitalId: "h1",
        uhid: "QX-9999",
        name: "Rajesh Kumar",
        age: 34,
        gender: "male" as const,
        phone: "+91 98765 43210",
        email: null,
      };

      const createResult = createPatientSchema.safeParse(newPatient);
      expect(createResult.success).toBe(true);

      const updatePayload = {
        phone: "+91 91234 56789",
        bloodGroup: "O+",
      };
      const updateResult = updatePatientSchema.safeParse(updatePayload);
      expect(updateResult.success).toBe(true);
    });

    it("validates queue entry creation and status updates", () => {
      const newQueueEntry = {
        hospitalId: "h1",
        departmentId: "d1",
        departmentName: "Pediatrics",
        doctorId: "doc1",
        doctorName: "Dr. Deepa",
        sessionId: "sess1",
        patientId: "pat1",
        patientName: "Baby Aarav",
        patientAge: 2,
        patientGender: "male" as const,
        tokenNumber: 5,
        tokenDisplay: "PED-005",
        arrivalTime: now,
      };

      const createResult = createQueueEntrySchema.safeParse(newQueueEntry);
      expect(createResult.success).toBe(true);
      if (createResult.success) {
        expect(createResult.data.priority).toBe("normal");
        expect(createResult.data.status).toBe("waiting");
      }

      // Test status update schema
      const statusUpdate = {
        status: "called" as const,
        calledAt: now,
      };
      const updateResult = updateQueueEntryStatusSchema.safeParse(statusUpdate);
      expect(updateResult.success).toBe(true);
    });

    it("validates OPD session creation defaults and status updates", () => {
      const newSession = {
        hospitalId: "h1",
        departmentId: "d1",
        departmentName: "Cardiology",
        doctorId: "doc1",
        doctorName: "Dr. Rao",
        roomNumber: "Room 101",
        date: "2026-11-08",
        startTime: "09:00",
        endTime: "13:00",
      };

      const result = createOPDSessionSchema.safeParse(newSession);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("scheduled");
        expect(result.data.totalTokensIssued).toBe(0);
        expect(result.data.completedCount).toBe(0);
      }

      const updateResult = updateOPDSessionSchema.safeParse({
        status: "paused",
        waitingCount: 15,
      });
      expect(updateResult.success).toBe(true);
    });

    it("validates department and doctor create/update schemas", () => {
      const dept = {
        hospitalId: "h1",
        name: "Orthopedics",
        code: "ORTH",
        floor: "3rd Floor",
      };
      expect(createDepartmentSchema.safeParse(dept).success).toBe(true);
      expect(updateDepartmentSchema.safeParse({ floor: "4th Floor" }).success).toBe(true);

      const doc = {
        hospitalId: "h1",
        departmentId: "d1",
        departmentName: "Orthopedics",
        name: "Dr. Sandeep",
        qualification: "MBBS, MS (Ortho)",
        specialization: "Joint Replacement",
        roomNumber: "Room 305",
      };
      expect(createDoctorSchema.safeParse(doc).success).toBe(true);
      expect(updateDoctorSchema.safeParse({ roomNumber: "Room 308" }).success).toBe(true);
    });

    it("validates appointment and operational event create schemas", () => {
      const appt = {
        hospitalId: "h1",
        patientId: "pat1",
        patientName: "Patient Name",
        patientPhone: "+91 99999 88888",
        doctorId: "doc1",
        doctorName: "Dr. Sandeep",
        departmentId: "d1",
        departmentName: "Orthopedics",
        scheduledDate: "2026-11-08",
        scheduledTime: "11:00",
        scheduledAt: now,
      };
      expect(createAppointmentSchema.safeParse(appt).success).toBe(true);
      expect(updateAppointmentSchema.safeParse({ status: "checked_in" }).success).toBe(true);

      const evt = {
        hospitalId: "h1",
        eventType: "doctor_paused" as const,
        timestamp: now,
      };
      expect(createOperationalEventSchema.safeParse(evt).success).toBe(true);
    });
  });

  describe("Domain Constants Consistency", () => {
    it("ensures centralized statuses match expected domain values", () => {
      expect(QUEUE_ENTRY_STATUSES).toContain("waiting");
      expect(QUEUE_ENTRY_STATUSES).toContain("called");
      expect(QUEUE_ENTRY_STATUSES).toContain("in_consultation");
      expect(QUEUE_ENTRY_STATUSES).toContain("completed");
      expect(QUEUE_ENTRY_STATUSES).toContain("skipped");
      expect(QUEUE_ENTRY_STATUSES).toContain("cancelled");

      expect(QUEUE_PRIORITIES).toEqual(["normal", "priority", "emergency"]);
      expect(OPD_SESSION_STATUSES).toContain("active");
      expect(APPOINTMENT_STATUSES).toContain("booked");
      expect(DOCTOR_STATUSES).toContain("active");
    });

    it("rejects invalid status values using centralized enum schemas", () => {
      const invalidStatusQueue = {
        status: "unknown_status",
      };
      expect(
        updateQueueEntryStatusSchema.safeParse(invalidStatusQueue).success
      ).toBe(false);

      const invalidRecommendationUpdate = {
        status: "not_a_status",
      };
      expect(
        updateRecommendationStatusSchema.safeParse(invalidRecommendationUpdate).success
      ).toBe(false);
    });
  });

  describe("Validation Constraints", () => {
    it("enforces positive consultation duration", () => {
      const invalidConsultation = {
        hospitalId: "h1",
        departmentId: "d1",
        departmentName: "General Medicine",
        doctorId: "doc1",
        doctorName: "Dr. Kumar",
        sessionId: "s1",
        queueEntryId: "q1",
        patientId: "p1",
        patientName: "Patient",
        tokenNumber: 1,
        startedAt: now,
        completedAt: now,
        durationSeconds: -50,
      };
      expect(createConsultationSchema.safeParse(invalidConsultation).success).toBe(false);
    });

    it("enforces positive token number", () => {
      const invalidQueueEntry = {
        hospitalId: "h1",
        departmentId: "d1",
        departmentName: "General Medicine",
        doctorId: "doc1",
        doctorName: "Dr. Kumar",
        sessionId: "s1",
        patientId: "p1",
        patientName: "Patient",
        patientAge: 25,
        patientGender: "female" as const,
        tokenNumber: 0, // must be positive
        tokenDisplay: "GM-000",
        arrivalTime: now,
      };
      expect(createQueueEntrySchema.safeParse(invalidQueueEntry).success).toBe(false);
    });

    it("validates prediction and recommendation creation schemas", () => {
      const pred = {
        hospitalId: "h1",
        departmentId: "d1",
        predictionType: "estimated_wait_time" as const,
        targetValue: 28,
        generatedAt: now,
        validUntil: new Date(now.getTime() + 600000),
      };
      expect(createPredictionSchema.safeParse(pred).success).toBe(true);

      const rec = {
        hospitalId: "h1",
        departmentId: "d1",
        type: "rebalance_queue" as const,
        title: "Rebalance Queue",
        description: "Rebalance pending tokens between room 1 and room 2",
        createdAt: now,
      };
      expect(createRecommendationSchema.safeParse(rec).success).toBe(true);
    });
  });
});
