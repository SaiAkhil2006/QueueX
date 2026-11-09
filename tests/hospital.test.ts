import { describe, it, expect } from "vitest";
import {
  getHospitalById,
  updateHospitalById,
} from "@/features/hospital/services/hospital.server";
import {
  GET as getHospitalRoute,
  PATCH as patchHospitalRoute,
} from "@/app/api/hospitals/[hospitalId]/route";
import { NextRequest } from "next/server";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";

describe("F1.1: Hospital Configuration", () => {
  describe("Server Service: getHospitalById", () => {
    it("returns null for non-existent hospital ID", async () => {
      const hospital = await getHospitalById("non-existent-hospital-999");
      expect(hospital).toBeNull();
    });

    it("successfully loads seeded hospital record with serialized ISO timestamps", async () => {
      const hospital = await getHospitalById(SEED_HOSPITAL_ID);
      expect(hospital).not.toBeNull();
      if (!hospital) return;

      expect(hospital.id).toBe(SEED_HOSPITAL_ID);
      expect(hospital.name).toBe("Visakha Multispeciality Hospital");
      expect(hospital.code).toBe("VMH");
      expect(hospital.timezone).toBe("Asia/Kolkata");
      expect(hospital.status).toBe("active");
      expect(hospital.configuration).toBeDefined();
      expect(hospital.configuration.opdMorningStartTime).toBe("08:30");
      expect(hospital.configuration.emergencyWaitThresholdMinutes).toBe(10);
      expect(typeof hospital.createdAt).toBe("string");
      expect(typeof hospital.updatedAt).toBe("string");
    });
  });

  describe("Server Service: updateHospitalById", () => {
    it("successfully updates configuration parameters and persists changes", async () => {
      const updated = await updateHospitalById(SEED_HOSPITAL_ID, {
        configuration: {
          emergencyWaitThresholdMinutes: 15,
          opdMorningStartTime: "08:45",
        },
      });

      expect(updated.configuration.emergencyWaitThresholdMinutes).toBe(15);
      expect(updated.configuration.opdMorningStartTime).toBe("08:45");

      // Verify persistence by refetching
      const refetched = await getHospitalById(SEED_HOSPITAL_ID);
      expect(refetched?.configuration.emergencyWaitThresholdMinutes).toBe(15);
      expect(refetched?.configuration.opdMorningStartTime).toBe("08:45");

      // Restore to original baseline
      await updateHospitalById(SEED_HOSPITAL_ID, {
        configuration: {
          emergencyWaitThresholdMinutes: 10,
          opdMorningStartTime: "08:30",
        },
      });
    });

    it("rejects invalid configuration with Zod validation error", async () => {
      await expect(
        updateHospitalById(SEED_HOSPITAL_ID, {
          configuration: {
            opdMorningStartTime: "invalid-time",
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("Route Handlers: /api/hospitals/[hospitalId]", () => {
    it("GET returns 200 with hospital data", async () => {
      const req = new NextRequest(`http://localhost:3000/api/hospitals/${SEED_HOSPITAL_ID}`);
      const res = await getHospitalRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(SEED_HOSPITAL_ID);
    });

    it("GET returns 404 for unknown hospital ID", async () => {
      const req = new NextRequest("http://localhost:3000/api/hospitals/unknown-999");
      const res = await getHospitalRoute(req, {
        params: Promise.resolve({ hospitalId: "unknown-999" }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("PATCH validates input and rejects malformed email", async () => {
      const req = new NextRequest(`http://localhost:3000/api/hospitals/${SEED_HOSPITAL_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ email: "not-an-email" }),
      });
      const res = await patchHospitalRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Validation failed");
    });
  });
});
