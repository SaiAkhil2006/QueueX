import { describe, it, expect } from "vitest";
import {
  hospitalSchema,
  departmentSchema,
  doctorSchema,
  doctorScheduleSchema,
  opdSessionSchema,
  patientSchema,
  appointmentSchema,
  queueEntrySchema,
  consultationSchema,
  operationalEventSchema,
  predictionSchema,
  recommendationSchema,
} from "@/types";
import { paths, COLLECTIONS } from "@/lib/firebase/collections";

describe("QueueX Firestore Entity Schemas & Path Helpers", () => {
  const baseHospitalId = "hosp-vzg-01";
  const now = new Date();

  describe("Collection Path Helpers", () => {
    it("generates correct collection and document paths", () => {
      expect(paths.hospitals()).toBe(COLLECTIONS.HOSPITALS);
      expect(paths.hospital("h1")).toBe("hospitals/h1");
      expect(paths.departments("h1")).toBe("hospitals/h1/departments");
      expect(paths.department("h1", "d1")).toBe("hospitals/h1/departments/d1");
      expect(paths.doctors("h1")).toBe("hospitals/h1/doctors");
      expect(paths.doctor("h1", "doc1")).toBe("hospitals/h1/doctors/doc1");
      expect(paths.schedules("h1")).toBe("hospitals/h1/schedules");
      expect(paths.sessions("h1")).toBe("hospitals/h1/sessions");
      expect(paths.session("h1", "s1")).toBe("hospitals/h1/sessions/s1");
      expect(paths.patients("h1")).toBe("hospitals/h1/patients");
      expect(paths.appointments("h1")).toBe("hospitals/h1/appointments");
      expect(paths.queueEntries("h1")).toBe("hospitals/h1/queueEntries");
      expect(paths.queueEntry("h1", "q1")).toBe("hospitals/h1/queueEntries/q1");
      expect(paths.consultations("h1")).toBe("hospitals/h1/consultations");
      expect(paths.operationalEvents("h1")).toBe("hospitals/h1/operationalEvents");
      expect(paths.predictions("h1")).toBe("hospitals/h1/predictions");
      expect(paths.recommendations("h1")).toBe("hospitals/h1/recommendations");
    });
  });

  describe("Hospital Schema", () => {
    it("validates a complete hospital document", () => {
      const data = {
        id: baseHospitalId,
        name: "Vizag Central Hospital",
        code: "VZG-CH",
        address: "7-10 Beach Road",
        city: "Visakhapatnam",
        state: "Andhra Pradesh",
        postalCode: "530002",
        timezone: "Asia/Kolkata",
        phone: "+91 891 2555555",
        email: "opd@vizagcentral.org",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      const result = hospitalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects when required fields are missing", () => {
      const result = hospitalSchema.safeParse({ id: "h1" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("name"))).toBe(true);
        expect(result.error.issues.some((i) => i.path.includes("email"))).toBe(true);
      }
    });
  });

  describe("Department Schema", () => {
    it("validates department with defaults", () => {
      const data = {
        id: "dept-cardio",
        hospitalId: baseHospitalId,
        name: "Cardiology",
        code: "CARD",
        floor: "2nd Floor",
        buildingWing: "Wing B",
        createdAt: now,
        updatedAt: now,
      };
      const result = departmentSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.avgConsultationDurationMinutes).toBe(15);
        expect(result.data.isActive).toBe(true);
      }
    });
  });

  describe("Doctor & OPDSession Schemas", () => {
    it("validates doctor document with denormalized department name", () => {
      const doctorData = {
        id: "doc-101",
        hospitalId: baseHospitalId,
        departmentId: "dept-cardio",
        departmentName: "Cardiology",
        name: "Dr. K. Srinivas",
        qualification: "MBBS, MD, DM (Cardiology)",
        specialization: "Interventional Cardiology",
        roomNumber: "Room 204",
        consultationDurationEstimate: 12,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      expect(doctorSchema.safeParse(doctorData).success).toBe(true);
    });

    it("validates OPD session status and time patterns", () => {
      const sessionData = {
        id: "sess-2026-11-07-cardio-1",
        hospitalId: baseHospitalId,
        departmentId: "dept-cardio",
        departmentName: "Cardiology",
        doctorId: "doc-101",
        doctorName: "Dr. K. Srinivas",
        roomNumber: "Room 204",
        date: "2026-11-07",
        startTime: "09:00",
        endTime: "13:00",
        status: "active",
        currentRunningToken: 14,
        totalTokensIssued: 35,
        completedCount: 13,
        waitingCount: 22,
        createdAt: now,
        updatedAt: now,
      };
      expect(opdSessionSchema.safeParse(sessionData).success).toBe(true);
    });

    it("rejects invalid session status and time format", () => {
      const invalid = {
        id: "s1",
        hospitalId: baseHospitalId,
        departmentId: "d1",
        departmentName: "D",
        doctorId: "doc1",
        doctorName: "Doc",
        roomNumber: "1",
        date: "invalid-date",
        startTime: "25:00",
        endTime: "13:00",
        status: "invalid-status",
        createdAt: now,
        updatedAt: now,
      };
      const result = opdSessionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("status"))).toBe(true);
        expect(result.error.issues.some((i) => i.path.includes("date"))).toBe(true);
        expect(result.error.issues.some((i) => i.path.includes("startTime"))).toBe(true);
      }
    });

    it("validates doctor schedule working days and break periods", () => {
      const schedule = {
        id: "sched-101",
        hospitalId: baseHospitalId,
        doctorId: "doc-101",
        departmentId: "dept-cardio",
        workingDays: [1, 2, 3, 4, 5], // Mon - Fri
        startTime: "09:00",
        endTime: "13:30",
        maxPatientsPerSession: 35,
        breakPeriods: [{ startTime: "11:30", endTime: "11:45", label: "Tea Break" }],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      expect(doctorScheduleSchema.safeParse(schedule).success).toBe(true);
    });
  });

  describe("Patient & Appointment Schemas", () => {
    it("validates patient record with emergency contact", () => {
      const patient = {
        id: "pat-501",
        hospitalId: baseHospitalId,
        uhid: "QX-2026-0501",
        name: "V. Lakshmi",
        age: 48,
        gender: "female",
        phone: "+91 98480 12345",
        emergencyContact: {
          name: "V. Prasad",
          phone: "+91 98480 54321",
          relation: "Spouse",
        },
        createdAt: now,
        updatedAt: now,
      };
      expect(patientSchema.safeParse(patient).success).toBe(true);
    });

    it("rejects patient with negative age", () => {
      const invalid = {
        id: "pat-502",
        hospitalId: baseHospitalId,
        uhid: "QX-2026-0502",
        name: "Test",
        age: -5,
        gender: "male",
        phone: "9848011111",
        createdAt: now,
        updatedAt: now,
      };
      expect(patientSchema.safeParse(invalid).success).toBe(false);
    });

    it("validates appointment record", () => {
      const appt = {
        id: "appt-901",
        hospitalId: baseHospitalId,
        patientId: "pat-501",
        patientName: "V. Lakshmi",
        patientPhone: "+91 98480 12345",
        doctorId: "doc-101",
        doctorName: "Dr. K. Srinivas",
        departmentId: "dept-cardio",
        departmentName: "Cardiology",
        scheduledDate: "2026-11-07",
        scheduledTime: "10:15",
        scheduledAt: now,
        appointmentType: "regular",
        status: "booked",
        createdAt: now,
        updatedAt: now,
      };
      expect(appointmentSchema.safeParse(appt).success).toBe(true);
    });
  });

  describe("QueueEntry & Priority Handling", () => {
    it("validates normal queue entry", () => {
      const entry = {
        id: "q-1001",
        hospitalId: baseHospitalId,
        departmentId: "dept-cardio",
        departmentName: "Cardiology",
        doctorId: "doc-101",
        doctorName: "Dr. K. Srinivas",
        sessionId: "sess-2026-11-07-cardio-1",
        patientId: "pat-501",
        patientName: "V. Lakshmi",
        patientAge: 48,
        patientGender: "female",
        tokenNumber: 15,
        tokenDisplay: "CARD-015",
        source: "walk_in",
        priority: "normal",
        status: "waiting",
        arrivalTime: now,
        createdAt: now,
        updatedAt: now,
      };
      expect(queueEntrySchema.safeParse(entry).success).toBe(true);
    });

    it("validates emergency queue entry independent of token number", () => {
      const emergencyEntry = {
        id: "q-1002",
        hospitalId: baseHospitalId,
        departmentId: "dept-cardio",
        departmentName: "Cardiology",
        doctorId: "doc-101",
        doctorName: "Dr. K. Srinivas",
        sessionId: "sess-2026-11-07-cardio-1",
        patientId: "pat-502",
        patientName: "Emergency Patient",
        patientAge: 62,
        patientGender: "male",
        tokenNumber: 38, // Arrived later in token count
        tokenDisplay: "EMERGENCY-01",
        source: "emergency",
        priority: "emergency", // Emergency priority for top triage ordering
        status: "waiting",
        arrivalTime: now,
        notes: "Acute chest pain, immediate triage required",
        createdAt: now,
        updatedAt: now,
      };
      const result = queueEntrySchema.safeParse(emergencyEntry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("emergency");
      }
    });

    it("rejects invalid queue status", () => {
      const invalid = {
        id: "q-1",
        hospitalId: baseHospitalId,
        departmentId: "d1",
        departmentName: "D",
        doctorId: "doc1",
        doctorName: "Doc",
        sessionId: "s1",
        patientId: "p1",
        patientName: "Pat",
        patientAge: 30,
        patientGender: "male",
        tokenNumber: 1,
        tokenDisplay: "01",
        status: "unknown_status",
        arrivalTime: now,
        createdAt: now,
        updatedAt: now,
      };
      expect(queueEntrySchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("Consultation & Historical Integrity", () => {
    it("validates historical consultation with exact duration in seconds", () => {
      const startTime = new Date("2026-11-07T10:00:00.000Z");
      const endTime = new Date("2026-11-07T10:14:30.000Z");
      const durationSeconds = 870; // 14 mins 30 secs

      const consultation = {
        id: "cons-2001",
        hospitalId: baseHospitalId,
        departmentId: "dept-cardio",
        departmentName: "Cardiology",
        doctorId: "doc-101",
        doctorName: "Dr. K. Srinivas",
        sessionId: "sess-2026-11-07-cardio-1",
        queueEntryId: "q-1001",
        patientId: "pat-501",
        patientName: "V. Lakshmi",
        tokenNumber: 15,
        startedAt: startTime,
        completedAt: endTime,
        durationSeconds,
        outcome: "prescribed",
        notes: "ECG normal, prescribed statin and follow up in 30 days",
        createdAt: endTime,
      };
      expect(consultationSchema.safeParse(consultation).success).toBe(true);
    });

    it("rejects negative duration seconds in consultation", () => {
      const invalid = {
        id: "c1",
        hospitalId: baseHospitalId,
        departmentId: "d1",
        departmentName: "D",
        doctorId: "doc1",
        doctorName: "Doc",
        sessionId: "s1",
        queueEntryId: "q1",
        patientId: "p1",
        patientName: "Pat",
        tokenNumber: 1,
        startedAt: now,
        completedAt: now,
        durationSeconds: -120,
        createdAt: now,
      };
      expect(consultationSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("OperationalEvent Schema", () => {
    it("validates operational event like doctor paused", () => {
      const event = {
        id: "evt-3001",
        hospitalId: baseHospitalId,
        departmentId: "dept-cardio",
        doctorId: "doc-101",
        sessionId: "sess-2026-11-07-cardio-1",
        eventType: "doctor_paused",
        severity: "warning",
        timestamp: now,
        actorId: "doc-101",
        actorRole: "doctor",
        description: "Doctor stepped out for emergency ward call",
        metadata: { estimatedResumeMinutes: 20 },
      };
      expect(operationalEventSchema.safeParse(event).success).toBe(true);
    });
  });

  describe("Prediction and Recommendation Schemas", () => {
    it("validates prediction document", () => {
      const prediction = {
        id: "pred-4001",
        hospitalId: baseHospitalId,
        departmentId: "dept-cardio",
        sessionId: "sess-2026-11-07-cardio-1",
        queueEntryId: "q-1001",
        predictionType: "estimated_wait_time",
        targetValue: 24, // 24 minutes estimated
        confidenceScore: 0.88,
        modelVersion: "v1.0-queuex-heuristic",
        contributingFactors: [
          { factor: "ahead_waiting_patients", impactMinutes: 18 },
          { factor: "doctor_speed_factor", impactMinutes: 6 },
        ],
        generatedAt: now,
        validUntil: new Date(now.getTime() + 15 * 60 * 1000),
      };
      expect(predictionSchema.safeParse(prediction).success).toBe(true);
    });

    it("validates recommendation document", () => {
      const recommendation = {
        id: "rec-5001",
        hospitalId: baseHospitalId,
        departmentId: "dept-cardio",
        sessionId: "sess-2026-11-07-cardio-1",
        type: "rebalance_queue",
        title: "Rebalance Cardiology Waiting Queue",
        description: "Transfer 4 walk-in patients from Room 204 to Room 206 to reduce queue delay",
        priority: "high",
        status: "pending",
        impactEstimate: "Reduces peak wait by ~16 minutes",
        actionPayload: { sourceDoctorId: "doc-101", targetDoctorId: "doc-102", patientCount: 4 },
        createdAt: now,
      };
      expect(recommendationSchema.safeParse(recommendation).success).toBe(true);
    });
  });
});
