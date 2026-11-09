import { describe, it, expect, beforeAll } from "vitest";
import {
  getSchedulesByHospital,
  getScheduleById,
  getScheduleByDoctorId,
  createOrUpdateDoctorSchedule,
  checkDoctorAvailability,
} from "@/features/schedules/services/schedules.server";
import {
  validateScheduleTiming,
  calculateDoctorAvailability,
} from "@/features/schedules/utils/availability";
import {
  GET as getSchedulesRoute,
  POST as postScheduleRoute,
} from "@/app/api/hospitals/[hospitalId]/schedules/route";
import {
  GET as getSingleScheduleRoute,
  PATCH as patchScheduleRoute,
} from "@/app/api/hospitals/[hospitalId]/schedules/[scheduleId]/route";
import { GET as getAvailabilityRoute } from "@/app/api/hospitals/[hospitalId]/schedules/availability/route";
import { NextRequest } from "next/server";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";

describe("F1.4: Doctor Schedules and Deterministic Availability", () => {
  beforeAll(async () => {
    await createOrUpdateDoctorSchedule(SEED_HOSPITAL_ID, "doc-gm-01", {
      startTime: "09:00",
      endTime: "17:00",
      maxPatientsPerSession: 45,
      workingDays: [1, 2, 3, 4, 5, 6],
      breakPeriods: [
        { label: "Lunch Break", startTime: "13:00", endTime: "14:00" },
      ],
      isActive: true,
    });
  });
  describe("Schedule Timing & Mathematical Validation", () => {
    it("fails when start time is equal or after end time", () => {
      expect(() =>
        validateScheduleTiming("17:00", "09:00", [])
      ).toThrow(/Start time .* must be strictly before end time/);

      expect(() =>
        validateScheduleTiming("12:00", "12:00", [])
      ).toThrow(/Start time .* must be strictly before end time/);
    });

    it("fails when a break period has invalid start/end sequence", () => {
      expect(() =>
        validateScheduleTiming("09:00", "17:00", [
          { label: "Bad Break", startTime: "14:00", endTime: "13:00" },
        ])
      ).toThrow(/must be before end time/);
    });

    it("fails when a break period is outside operating shift hours", () => {
      expect(() =>
        validateScheduleTiming("09:00", "17:00", [
          { label: "Early Break", startTime: "08:00", endTime: "08:30" },
        ])
      ).toThrow(/must fall entirely within operating hours/);

      expect(() =>
        validateScheduleTiming("09:00", "17:00", [
          { label: "Late Break", startTime: "17:00", endTime: "17:30" },
        ])
      ).toThrow(/must fall entirely within operating hours/);
    });

    it("fails when break periods overlap with each other", () => {
      expect(() =>
        validateScheduleTiming("09:00", "17:00", [
          { label: "Break 1", startTime: "12:00", endTime: "13:30" },
          { label: "Break 2", startTime: "13:00", endTime: "14:00" },
        ])
      ).toThrow(/overlaps with break/);
    });

    it("passes with valid non-overlapping breaks within shift hours", () => {
      expect(() =>
        validateScheduleTiming("09:00", "17:00", [
          { label: "Tea", startTime: "11:00", endTime: "11:15" },
          { label: "Lunch", startTime: "13:00", endTime: "14:00" },
          { label: "Evening Tea", startTime: "16:00", endTime: "16:15" },
        ])
      ).not.toThrow();
    });
  });

  describe("Deterministic Availability Calculation Utility", () => {
    const mockSchedule = {
      id: "sch-mock-01",
      hospitalId: SEED_HOSPITAL_ID,
      doctorId: "doc-mock-01",
      departmentId: "dept-gm",
      workingDays: [1, 2, 3, 4, 5], // Monday - Friday
      startTime: "09:00",
      endTime: "17:00",
      maxPatientsPerSession: 40,
      breakPeriods: [
        { label: "Lunch Break", startTime: "13:00", endTime: "14:00" },
      ],
      isActive: true,
      createdAt: "2026-11-01T00:00:00.000Z",
      updatedAt: "2026-11-01T00:00:00.000Z",
    };

    it("reports not working day for Sunday (day 0)", () => {
      // 2026-11-08 is Sunday
      const res = calculateDoctorAvailability(mockSchedule, "2026-11-08", "10:00");
      expect(res.isAvailable).toBe(false);
      expect(res.status).toBe("not_working_day");
      expect(res.reason).toContain("Sunday");
    });

    it("reports outside hours before shift begins", () => {
      // 2026-11-09 is Monday
      const res = calculateDoctorAvailability(mockSchedule, "2026-11-09", "08:15");
      expect(res.isAvailable).toBe(false);
      expect(res.status).toBe("outside_hours");
      expect(res.nextAvailableTime).toBe("09:00");
    });

    it("reports on break during scheduled break window", () => {
      // Monday at 13:30 (Lunch is 13:00-14:00)
      const res = calculateDoctorAvailability(mockSchedule, "2026-11-09", "13:30");
      expect(res.isAvailable).toBe(false);
      expect(res.status).toBe("on_break");
      expect(res.reason).toContain("Lunch Break");
      expect(res.nextAvailableTime).toBe("14:00");
    });

    it("reports available during working hours outside breaks", () => {
      // Monday at 10:30
      const res = calculateDoctorAvailability(mockSchedule, "2026-11-09", "10:30");
      expect(res.isAvailable).toBe(true);
      expect(res.status).toBe("available");
    });

    it("reports outside hours after shift ends", () => {
      // Monday at 17:30
      const res = calculateDoctorAvailability(mockSchedule, "2026-11-09", "17:30");
      expect(res.isAvailable).toBe(false);
      expect(res.status).toBe("outside_hours");
    });
  });

  describe("Server Service: Schedules Management", () => {
    it("retrieves seeded schedules with augmented doctor names and departments", async () => {
      const schedules = await getSchedulesByHospital(SEED_HOSPITAL_ID);
      expect(schedules.length).toBeGreaterThanOrEqual(10);

      const schRajesh = schedules.find((s) => s.doctorId === "doc-gm-01");
      expect(schRajesh).toBeDefined();
      expect(schRajesh?.doctorName).toBe("Dr. Rajesh Varma");
      expect(schRajesh?.departmentName).toBe("General Medicine");
      expect(schRajesh?.startTime).toBe("09:00");
      expect(schRajesh?.endTime).toBe("17:00");
      expect(schRajesh?.workingDays).toContain(1);
    });

    it("retrieves schedule by doctor ID", async () => {
      const sch = await getScheduleByDoctorId(SEED_HOSPITAL_ID, "doc-gm-01");
      expect(sch).not.toBeNull();
      expect(sch?.doctorId).toBe("doc-gm-01");
      expect(sch?.doctorName).toBe("Dr. Rajesh Varma");
    });

    it("retrieves schedule by schedule ID", async () => {
      const sch = await getScheduleById(SEED_HOSPITAL_ID, "sch-doc-gm-01");
      expect(sch).not.toBeNull();
      expect(sch?.id).toBe("sch-doc-gm-01");
      expect(sch?.doctorName).toBe("Dr. Rajesh Varma");
      expect(sch?.departmentName).toBe("General Medicine");
    });

    it("updates doctor schedule operating parameters", async () => {
      const updated = await createOrUpdateDoctorSchedule(
        SEED_HOSPITAL_ID,
        "doc-cardio-01",
        {
          maxPatientsPerSession: 35,
          startTime: "08:30",
          endTime: "16:30",
          breakPeriods: [
            { label: "Lunch", startTime: "12:30", endTime: "13:30" },
          ],
        }
      );

      expect(updated.maxPatientsPerSession).toBe(35);
      expect(updated.startTime).toBe("08:30");
      expect(updated.endTime).toBe("16:30");
      expect(updated.breakPeriods.length).toBe(1);

      // Revert back
      await createOrUpdateDoctorSchedule(SEED_HOSPITAL_ID, "doc-cardio-01", {
        maxPatientsPerSession: 30,
        startTime: "09:00",
        endTime: "17:00",
        breakPeriods: [
          { label: "Lunch Break", startTime: "13:00", endTime: "14:00" },
        ],
      });
    });

    it("checks real-time availability for doctor via service", async () => {
      // Monday 2026-11-09 at 10:00 (available)
      const morningRes = await checkDoctorAvailability(
        SEED_HOSPITAL_ID,
        "doc-gm-01",
        "2026-11-09",
        "10:00"
      );
      expect(morningRes.isAvailable).toBe(true);
      expect(morningRes.status).toBe("available");

      // Monday at 13:30 (on lunch break)
      const lunchRes = await checkDoctorAvailability(
        SEED_HOSPITAL_ID,
        "doc-gm-01",
        "2026-11-09",
        "13:30"
      );
      expect(lunchRes.isAvailable).toBe(false);
      expect(lunchRes.status).toBe("on_break");
    });
  });

  describe("API Route Handlers", () => {
    it("GET /api/hospitals/[hospitalId]/schedules returns list", async () => {
      const req = new NextRequest(
        `http://localhost/api/hospitals/${SEED_HOSPITAL_ID}/schedules`
      );
      const res = await getSchedulesRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(10);
    });

    it("POST /api/hospitals/[hospitalId]/schedules updates schedule", async () => {
      const req = new NextRequest(
        `http://localhost/api/hospitals/${SEED_HOSPITAL_ID}/schedules`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorId: "doc-gm-02",
            workingDays: [1, 2, 3, 4, 5, 6],
            startTime: "09:00",
            endTime: "17:00",
            maxPatientsPerSession: 42,
            breakPeriods: [
              { label: "Lunch", startTime: "13:00", endTime: "14:00" },
            ],
            isActive: true,
          }),
        }
      );

      const res = await postScheduleRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.doctorId).toBe("doc-gm-02");
      expect(json.data.maxPatientsPerSession).toBe(42);
    });

    it("GET /api/hospitals/[hospitalId]/schedules/[scheduleId] retrieves single schedule", async () => {
      const req = new NextRequest(
        `http://localhost/api/hospitals/${SEED_HOSPITAL_ID}/schedules/sch-doc-gm-01`
      );
      const res = await getSingleScheduleRoute(req, {
        params: Promise.resolve({
          hospitalId: SEED_HOSPITAL_ID,
          scheduleId: "sch-doc-gm-01",
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe("sch-doc-gm-01");
      expect(json.data.doctorName).toBe("Dr. Rajesh Varma");
    });

    it("PATCH /api/hospitals/[hospitalId]/schedules/[scheduleId] updates schedule parameters", async () => {
      const req = new NextRequest(
        `http://localhost/api/hospitals/${SEED_HOSPITAL_ID}/schedules/sch-doc-cardio-01`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            maxPatientsPerSession: 33,
          }),
        }
      );
      const res = await patchScheduleRoute(req, {
        params: Promise.resolve({
          hospitalId: SEED_HOSPITAL_ID,
          scheduleId: "sch-doc-cardio-01",
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.maxPatientsPerSession).toBe(33);

      // Revert back
      await createOrUpdateDoctorSchedule(SEED_HOSPITAL_ID, "doc-cardio-01", {
        maxPatientsPerSession: 30,
      });
    });

    it("GET /api/hospitals/[hospitalId]/schedules/availability calculates availability via query", async () => {
      const req = new NextRequest(
        `http://localhost/api/hospitals/${SEED_HOSPITAL_ID}/schedules/availability?doctorId=doc-gm-01&date=2026-11-09&time=10:30`
      );
      const res = await getAvailabilityRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.isAvailable).toBe(true);
      expect(json.data.status).toBe("available");
    });
  });
});
