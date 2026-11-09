import { describe, it, expect } from "vitest";
import { getStaffDashboardData } from "@/features/dashboard/services/dashboard.server";
import { GET as getDashboardRoute } from "@/app/api/hospitals/[hospitalId]/dashboard/route";
import { NextRequest } from "next/server";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";

describe("F1.6: Staff Operational Dashboard Telemetry", () => {
  describe("Server Service: getStaffDashboardData", () => {
    it("aggregates real hospital data from Firestore", async () => {
      const data = await getStaffDashboardData(SEED_HOSPITAL_ID);

      expect(data).toBeDefined();
      expect(data.hospital).toBeDefined();
      expect(data.hospital.hospitalId).toBe(SEED_HOSPITAL_ID);
      expect(data.hospital.hospitalName).toBe("Visakha Multispeciality Hospital");
      expect(data.hospital.operatingStatus).toBe("active");
      expect(data.hospital.activeDepartmentsCount).toBeGreaterThanOrEqual(5);
      expect(data.hospital.activeDoctorsCount).toBeGreaterThanOrEqual(10);
    });

    it("aggregates accurate session counts for today", async () => {
      const data = await getStaffDashboardData(SEED_HOSPITAL_ID);

      expect(data.sessionsSummary).toBeDefined();
      expect(typeof data.sessionsSummary.totalToday).toBe("number");
      expect(typeof data.sessionsSummary.active).toBe("number");
      expect(typeof data.sessionsSummary.paused).toBe("number");
      expect(typeof data.sessionsSummary.scheduled).toBe("number");
      expect(typeof data.sessionsSummary.completed).toBe("number");
      expect(data.sessionsSummary.totalToday).toBe(
        data.sessionsSummary.active +
          data.sessionsSummary.paused +
          data.sessionsSummary.scheduled +
          data.sessionsSummary.completed +
          data.sessionsSummary.cancelled
      );
    });

    it("provides department summaries with assigned doctors and status", async () => {
      const data = await getStaffDashboardData(SEED_HOSPITAL_ID);

      expect(Array.isArray(data.departments)).toBe(true);
      expect(data.departments.length).toBeGreaterThanOrEqual(5);

      const gm = data.departments.find((d) => d.code === "GM");
      expect(gm).toBeDefined();
      expect(gm?.name).toBe("General Medicine");
      expect(gm?.assignedDoctorsCount).toBeGreaterThanOrEqual(2);
      expect(gm?.operationalStatus).toBeDefined();
    });

    it("provides doctor availability summaries with current/next session status", async () => {
      const data = await getStaffDashboardData(SEED_HOSPITAL_ID);

      expect(Array.isArray(data.doctors)).toBe(true);
      expect(data.doctors.length).toBeGreaterThanOrEqual(10);

      const firstDoc = data.doctors[0];
      expect(firstDoc).toHaveProperty("id");
      expect(firstDoc).toHaveProperty("name");
      expect(firstDoc).toHaveProperty("departmentName");
      expect(firstDoc).toHaveProperty("availability");
      expect(firstDoc).toHaveProperty("currentSessionStatus");
    });

    it("orders upcoming sessions in strictly chronological order", async () => {
      const data = await getStaffDashboardData(SEED_HOSPITAL_ID);

      expect(Array.isArray(data.upcomingSessions)).toBe(true);
      for (let i = 1; i < data.upcomingSessions.length; i++) {
        const prev = data.upcomingSessions[i - 1];
        const curr = data.upcomingSessions[i];
        const prevKey = `${prev.date} ${prev.startTime}`;
        const currKey = `${curr.date} ${curr.startTime}`;
        expect(prevKey.localeCompare(currKey)).toBeLessThanOrEqual(0);
      }
    });

    it("returns recent operational events with valid metadata", async () => {
      const data = await getStaffDashboardData(SEED_HOSPITAL_ID);

      expect(Array.isArray(data.recentEvents)).toBe(true);
      if (data.recentEvents.length > 0) {
        const evt = data.recentEvents[0];
        expect(evt).toHaveProperty("id");
        expect(evt).toHaveProperty("eventType");
        expect(evt).toHaveProperty("timestamp");
      }
    });
  });

  describe("API Route Handler: /api/hospitals/[hospitalId]/dashboard", () => {
    it("GET /api/hospitals/[hospitalId]/dashboard returns 200 with complete telemetry", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/hospitals/${SEED_HOSPITAL_ID}/dashboard`
      );
      const res = await getDashboardRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.hospital.hospitalId).toBe(SEED_HOSPITAL_ID);
      expect(json.data.sessionsSummary.totalToday).toBeGreaterThanOrEqual(0);
      expect(json.data.departments.length).toBeGreaterThanOrEqual(5);
    });

    it("GET returns 400 when hospitalId is missing", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/hospitals//dashboard"
      );
      const res = await getDashboardRoute(req, {
        params: Promise.resolve({ hospitalId: "" }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Hospital ID is required");
    });
  });
});
