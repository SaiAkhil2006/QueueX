import { describe, it, expect, afterAll } from "vitest";
import {
  getDepartmentsByHospital,
  getDepartmentById,
  createDepartment,
  updateDepartment,
} from "@/features/departments/services/departments.server";
import {
  GET as getDepartmentsRoute,
  POST as postDepartmentRoute,
} from "@/app/api/hospitals/[hospitalId]/departments/route";
import {
  GET as getSingleDepartmentRoute,
  PATCH as patchDepartmentRoute,
} from "@/app/api/hospitals/[hospitalId]/departments/[departmentId]/route";
import { NextRequest } from "next/server";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";

describe("F1.2: Clinical Department Management", () => {
  const testDeptId = "dept-test-neuro";

  afterAll(async () => {
    // Clean up test department if created
    const db = getAdminFirestore();
    await db.doc(paths.department(SEED_HOSPITAL_ID, testDeptId)).delete().catch(() => {});
  });

  describe("Server Service: getDepartmentsByHospital", () => {
    it("retrieves seeded departments with accurate doctor counts", async () => {
      const departments = await getDepartmentsByHospital(SEED_HOSPITAL_ID);
      expect(departments.length).toBeGreaterThanOrEqual(6);

      const gm = departments.find((d) => d.id === "dept-gm");
      expect(gm).toBeDefined();
      expect(gm?.name).toBe("General Medicine");
      expect(gm?.code).toBe("GM");
      expect(gm?.doctorCount).toBe(2);
      expect(gm?.activeDoctorCount).toBe(2);
    });
  });

  describe("Server Service: getDepartmentById", () => {
    it("returns null for non-existent department", async () => {
      const dept = await getDepartmentById(SEED_HOSPITAL_ID, "non-existent-dept");
      expect(dept).toBeNull();
    });

    it("returns department details for existing ID", async () => {
      const dept = await getDepartmentById(SEED_HOSPITAL_ID, "dept-cardio");
      expect(dept).not.toBeNull();
      expect(dept?.name).toBe("Cardiology");
      expect(dept?.code).toBe("CARD");
      expect(dept?.avgConsultationDurationMinutes).toBe(20);
    });
  });

  describe("Server Service: createDepartment & Duplicate Prevention", () => {
    it("successfully creates a new department with stable ID", async () => {
      const created = await createDepartment(SEED_HOSPITAL_ID, {
        id: testDeptId,
        name: "Neurology",
        code: "NEURO",
        description: "Brain, spinal cord, and peripheral nervous system disorders",
        floor: "3rd Floor",
        buildingWing: "A-Wing",
        avgConsultationDurationMinutes: 18,
        status: "active",
      });

      expect(created.id).toBe(testDeptId);
      expect(created.name).toBe("Neurology");
      expect(created.code).toBe("NEURO");
      expect(created.status).toBe("active");
      expect(created.doctorCount).toBe(0);
    });

    it("rejects duplicate department name (case-insensitive)", async () => {
      await expect(
        createDepartment(SEED_HOSPITAL_ID, {
          name: "neurology", // case-insensitive duplicate
          code: "NR2",
          avgConsultationDurationMinutes: 15,
        })
      ).rejects.toThrow(/already exists/i);
    });

    it("rejects duplicate department code", async () => {
      await expect(
        createDepartment(SEED_HOSPITAL_ID, {
          name: "Different Neuro",
          code: "NEURO", // duplicate code
          avgConsultationDurationMinutes: 15,
        })
      ).rejects.toThrow(/already exists/i);
    });
  });

  describe("Server Service: updateDepartment & Status Changes", () => {
    it("updates department details and preserves existing fields", async () => {
      const updated = await updateDepartment(SEED_HOSPITAL_ID, testDeptId, {
        floor: "4th Floor",
        avgConsultationDurationMinutes: 20,
      });

      expect(updated.floor).toBe("4th Floor");
      expect(updated.avgConsultationDurationMinutes).toBe(20);
      expect(updated.name).toBe("Neurology"); // Preserved
    });

    it("deactivates and reactivates department without deleting records", async () => {
      const deactivated = await updateDepartment(SEED_HOSPITAL_ID, testDeptId, {
        status: "inactive",
      });
      expect(deactivated.status).toBe("inactive");
      expect(deactivated.isActive).toBe(false);

      const reactivated = await updateDepartment(SEED_HOSPITAL_ID, testDeptId, {
        status: "active",
      });
      expect(reactivated.status).toBe("active");
      expect(reactivated.isActive).toBe(true);
    });
  });

  describe("Route Handlers: /api/hospitals/[hospitalId]/departments", () => {
    it("GET returns 200 with list of departments", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/hospitals/${SEED_HOSPITAL_ID}/departments`
      );
      const res = await getDepartmentsRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(6);
    });

    it("GET single department returns 200 for existing department", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/hospitals/${SEED_HOSPITAL_ID}/departments/dept-gm`
      );
      const res = await getSingleDepartmentRoute(req, {
        params: Promise.resolve({
          hospitalId: SEED_HOSPITAL_ID,
          departmentId: "dept-gm",
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe("dept-gm");
    });

    it("POST rejects duplicate department with 409 status", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/hospitals/${SEED_HOSPITAL_ID}/departments`,
        {
          method: "POST",
          body: JSON.stringify({
            name: "Cardiology", // Already exists
            code: "NEWCD",
            avgConsultationDurationMinutes: 15,
          }),
        }
      );
      const res = await postDepartmentRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("already exists");
    });

    it("PATCH updates department details and returns 200", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/hospitals/${SEED_HOSPITAL_ID}/departments/${testDeptId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            buildingWing: "C-Wing",
          }),
        }
      );
      const res = await patchDepartmentRoute(req, {
        params: Promise.resolve({
          hospitalId: SEED_HOSPITAL_ID,
          departmentId: testDeptId,
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.buildingWing).toBe("C-Wing");
    });
  });
});
