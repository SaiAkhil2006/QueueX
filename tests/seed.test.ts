import { describe, it, expect } from "vitest";
import { generateSeedDataset, validateSeedDataset } from "../scripts/seed/generator";
import { getKolkataDateString, createKolkataDateTime, createKolkataTimestamp } from "../scripts/seed/dates";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";
import { toDate } from "@/lib/firebase/timestamps";

describe("QueueX F0.6 Synthetic Hospital Seed Data", () => {
  const baseDate = new Date("2026-11-07T10:00:00+05:30");
  const dataset = generateSeedDataset({ baseDate });
  const report = validateSeedDataset(dataset);

  describe("Dataset Generation & Schema Compliance", () => {
    it("should generate a completely valid dataset passing all Zod schemas", () => {
      expect(report.valid).toBe(true);
      expect(report.errors).toHaveLength(0);
    });

    it("should generate exact required entity counts", () => {
      expect(report.counts.hospital).toBe(1);
      expect(report.counts.departments).toBe(6);
      expect(report.counts.doctors).toBe(12);
      expect(report.counts.schedules).toBe(12);
      expect(report.counts.sessions).toBe(72);
      expect(report.counts.patients).toBe(50);
      expect(report.counts.appointments).toBe(60);
      expect(report.counts.consultations).toBe(100);
      expect(report.totalEntities).toBe(313);
    });
  });

  describe("Hospital Verification", () => {
    it("should match Visakha Multispeciality Hospital specifications", () => {
      const h = dataset.hospital;
      expect(h.id).toBe(SEED_HOSPITAL_ID);
      expect(h.name).toBe("Visakha Multispeciality Hospital");
      expect(h.code).toBe("VMH");
      expect(h.city).toBe("Visakhapatnam");
      expect(h.state).toBe("Andhra Pradesh");
      expect(h.timezone).toBe("Asia/Kolkata");
      expect(h.status).toBe("active");
      expect(h.isActive).toBe(true);
      expect(h.configuration.opdMorningStartTime).toBe("08:30");
      expect(h.configuration.opdMorningEndTime).toBe("13:30");
      expect(h.configuration.emergencyWaitThresholdMinutes).toBe(10);
    });
  });

  describe("Departments Verification", () => {
    it("should contain all 6 required clinical departments", () => {
      const deptIds = dataset.departments.map((d) => d.id);
      expect(deptIds).toEqual([
        "dept-gm",
        "dept-cardio",
        "dept-ortho",
        "dept-derm",
        "dept-pedia",
        "dept-ent",
      ]);
    });

    it("should have positive average consultation durations", () => {
      for (const dept of dataset.departments) {
        expect(dept.avgConsultationDurationMinutes).toBeGreaterThan(0);
        expect(dept.hospitalId).toBe(SEED_HOSPITAL_ID);
        expect(dept.status).toBe("active");
      }
    });
  });

  describe("Doctors Verification & Pace Heterogeneity", () => {
    it("should assign 2 doctors per department", () => {
      const countsByDept: Record<string, number> = {};
      for (const doc of dataset.doctors) {
        countsByDept[doc.departmentId] = (countsByDept[doc.departmentId] || 0) + 1;
      }

      for (const dept of dataset.departments) {
        expect(countsByDept[dept.id]).toBe(2);
      }
    });

    it("should demonstrate heterogeneous consultation duration estimates", () => {
      const gmDoctor = dataset.doctors.find((d) => d.id === "doc-gm-01");
      const cardioDoctor = dataset.doctors.find((d) => d.id === "doc-cardio-01");

      expect(gmDoctor).toBeDefined();
      expect(cardioDoctor).toBeDefined();
      // Fast doctor vs complex/thorough doctor
      expect(gmDoctor!.consultationDurationEstimate).toBe(10);
      expect(cardioDoctor!.consultationDurationEstimate).toBe(22);
      expect(cardioDoctor!.consultationDurationEstimate).toBeGreaterThan(
        gmDoctor!.consultationDurationEstimate
      );
    });

    it("should provide valid contact details and room assignments", () => {
      for (const doc of dataset.doctors) {
        expect(doc.roomNumber).toBeTruthy();
        expect(doc.qualification).toBeTruthy();
        expect(doc.email).toContain("@visakhahospital.org");
      }
    });
  });

  describe("Doctor Schedules & OPD Sessions", () => {
    it("should generate a schedule for each doctor with working days and break period", () => {
      expect(dataset.schedules).toHaveLength(dataset.doctors.length);
      for (const sch of dataset.schedules) {
        expect(sch.workingDays.length).toBeGreaterThan(0);
        expect(sch.breakPeriods).toHaveLength(1);
        expect(sch.breakPeriods[0].label).toBe("Lunch Break");
      }
    });

    it("should distribute OPD sessions across past, present, and future dates", () => {
      const statuses = new Set(dataset.sessions.map((s) => s.status));
      expect(statuses.has("completed")).toBe(true);
      expect(statuses.has("active")).toBe(true);
      expect(statuses.has("scheduled")).toBe(true);
    });
  });

  describe("Patients Verification", () => {
    it("should have unique IDs and UHIDs formatted as QX-2026-XXXX", () => {
      const ids = new Set<string>();
      const uhids = new Set<string>();

      for (const pat of dataset.patients) {
        expect(ids.has(pat.id)).toBe(false);
        expect(uhids.has(pat.uhid)).toBe(false);
        ids.add(pat.id);
        uhids.add(pat.uhid);

        expect(pat.uhid).toMatch(/^QX-2026-\d{4}$/);
        expect(pat.phone).toMatch(/^\+91 98480 \d{5}$/);
        expect(pat.emergencyContact).toBeDefined();
        expect(pat.emergencyContact?.relation).toBeTruthy();
      }
    });

    it("should represent pediatric, adult, and geriatric age distributions", () => {
      const ages = dataset.patients.map((p) => p.age);
      const hasPediatric = ages.some((age) => age < 18);
      const hasAdult = ages.some((age) => age >= 18 && age < 60);
      const hasGeriatric = ages.some((age) => age >= 60);

      expect(hasPediatric).toBe(true);
      expect(hasAdult).toBe(true);
      expect(hasGeriatric).toBe(true);
    });
  });

  describe("Appointments Verification", () => {
    it("should have realistic status distribution across past, present, and future", () => {
      const statuses = dataset.appointments.map((a) => a.status);
      expect(statuses.filter((s) => s === "completed").length).toBeGreaterThanOrEqual(20);
      expect(statuses.filter((s) => s === "checked_in").length).toBe(8);
      expect(statuses.filter((s) => s === "booked").length).toBeGreaterThanOrEqual(20);
      expect(statuses.filter((s) => s === "cancelled").length).toBeGreaterThanOrEqual(2);
      expect(statuses.filter((s) => s === "no_show").length).toBeGreaterThanOrEqual(3);
    });

    it("should have valid scheduledAt timestamps matching scheduledDate and scheduledTime", () => {
      for (const apt of dataset.appointments) {
        const d = toDate(apt.scheduledAt);
        expect(d).not.toBeNull();
        expect(apt.scheduledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(apt.scheduledTime).toMatch(/^([01]\d|2[0-3]):([0-5]\d)$/);
      }
    });
  });

  describe("Historical Consultations & Duration Characteristics", () => {
    it("should guarantee completedAt > startedAt and positive duration", () => {
      for (const cns of dataset.consultations) {
        const start = toDate(cns.startedAt)!;
        const end = toDate(cns.completedAt)!;
        expect(end.getTime()).toBeGreaterThan(start.getTime());

        const diffSeconds = Math.round((end.getTime() - start.getTime()) / 1000);
        expect(cns.durationSeconds).toBe(diffSeconds);
        expect(cns.durationSeconds).toBeGreaterThan(0);
      }
    });

    it("should reflect doctor pacing in consultation durations", () => {
      const gmConsults = dataset.consultations.filter((c) => c.doctorId === "doc-gm-01");
      const cardioConsults = dataset.consultations.filter((c) => c.doctorId === "doc-cardio-01");

      const gmAvgDuration =
        gmConsults.reduce((acc, c) => acc + c.durationSeconds, 0) / gmConsults.length;
      const cardioAvgDuration =
        cardioConsults.reduce((acc, c) => acc + c.durationSeconds, 0) / cardioConsults.length;

      // Dr. Somasekhar (Cardiology) takes significantly longer than Dr. Rajesh Varma (General Medicine)
      expect(cardioAvgDuration).toBeGreaterThan(gmAvgDuration * 1.5);
    });
  });

  describe("Referential Integrity", () => {
    it("should verify that every foreign key resolves to a valid entity", () => {
      const deptIds = new Set(dataset.departments.map((d) => d.id));
      const docIds = new Set(dataset.doctors.map((d) => d.id));
      const patIds = new Set(dataset.patients.map((p) => p.id));
      const sesIds = new Set(dataset.sessions.map((s) => s.id));

      for (const doc of dataset.doctors) {
        expect(deptIds.has(doc.departmentId)).toBe(true);
      }

      for (const sch of dataset.schedules) {
        expect(docIds.has(sch.doctorId)).toBe(true);
        expect(deptIds.has(sch.departmentId)).toBe(true);
      }

      for (const ses of dataset.sessions) {
        expect(docIds.has(ses.doctorId)).toBe(true);
        expect(deptIds.has(ses.departmentId)).toBe(true);
      }

      for (const apt of dataset.appointments) {
        expect(patIds.has(apt.patientId)).toBe(true);
        expect(docIds.has(apt.doctorId)).toBe(true);
        expect(deptIds.has(apt.departmentId)).toBe(true);
      }

      for (const cns of dataset.consultations) {
        expect(patIds.has(cns.patientId)).toBe(true);
        expect(docIds.has(cns.doctorId)).toBe(true);
        expect(deptIds.has(cns.departmentId)).toBe(true);
        expect(sesIds.has(cns.sessionId)).toBe(true);
      }
    });
  });

  describe("Deterministic Date Utilities", () => {
    it("should generate deterministic dates in Asia/Kolkata timezone", () => {
      const fixedBase = new Date("2026-11-07T12:00:00+05:30");
      expect(getKolkataDateString(-2, fixedBase)).toBe("2026-11-05");
      expect(getKolkataDateString(-1, fixedBase)).toBe("2026-11-06");
      expect(getKolkataDateString(0, fixedBase)).toBe("2026-11-07");
      expect(getKolkataDateString(1, fixedBase)).toBe("2026-11-08");
      expect(getKolkataDateString(2, fixedBase)).toBe("2026-11-09");
    });

    it("should parse date and time into valid Date and Timestamp", () => {
      const date = createKolkataDateTime("2026-11-07", "09:30");
      expect(date.toISOString()).toBe("2026-11-07T04:00:00.000Z");

      const ts = createKolkataTimestamp("2026-11-07", "09:30");
      expect(ts.toDate().toISOString()).toBe("2026-11-07T04:00:00.000Z");
    });
  });
});
