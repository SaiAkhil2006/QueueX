import { describe, it, expect, afterAll } from "vitest";
import {
  getDoctorsByHospital,
  getDoctorById,
  getDoctorProfile,
  createDoctor,
  updateDoctor,
} from "@/features/doctors/services/doctors.server";
import {
  GET as getDoctorsRoute,
  POST as postDoctorRoute,
} from "@/app/api/hospitals/[hospitalId]/doctors/route";
import {
  GET as getSingleDoctorRoute,
  PATCH as patchDoctorRoute,
} from "@/app/api/hospitals/[hospitalId]/doctors/[doctorId]/route";
import { NextRequest } from "next/server";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";

describe("F1.3: Doctor Management & Clinical Staffing", () => {
  const testDoctorId = "doc-test-999";
  const testDoctorRouteId = "doc-route-test-888";

  afterAll(async () => {
    const db = getAdminFirestore();
    await db.doc(paths.doctor(SEED_HOSPITAL_ID, testDoctorId)).delete().catch(() => {});
    await db.doc(paths.doctor(SEED_HOSPITAL_ID, testDoctorRouteId)).delete().catch(() => {});
  });

  describe("Server Service: getDoctorsByHospital", () => {
    it("retrieves all seeded doctors for the hospital", async () => {
      const doctors = await getDoctorsByHospital(SEED_HOSPITAL_ID);
      expect(doctors.length).toBeGreaterThanOrEqual(10);

      const drRajesh = doctors.find((d) => d.id === "doc-gm-01");
      expect(drRajesh).toBeDefined();
      expect(drRajesh?.name).toBe("Dr. Rajesh Varma");
      expect(drRajesh?.departmentId).toBe("dept-gm");
      expect(drRajesh?.departmentName).toBe("General Medicine");
      expect(drRajesh?.roomNumber).toBe("101");
      expect(drRajesh?.consultationDurationEstimate).toBe(10);
    });

    it("filters doctors by departmentId", async () => {
      const gmDoctors = await getDoctorsByHospital(SEED_HOSPITAL_ID, {
        departmentId: "dept-gm",
      });
      expect(gmDoctors.length).toBe(2);
      expect(gmDoctors.every((d) => d.departmentId === "dept-gm")).toBe(true);
    });

    it("filters doctors by availability", async () => {
      const availableDocs = await getDoctorsByHospital(SEED_HOSPITAL_ID, {
        availability: "available",
      });
      expect(availableDocs.length).toBeGreaterThan(0);
      expect(availableDocs.every((d) => d.availability === "available")).toBe(true);
    });

    it("filters doctors by search term across name, specialization, and room", async () => {
      const searchByName = await getDoctorsByHospital(SEED_HOSPITAL_ID, {
        search: "Rajesh",
      });
      expect(searchByName.length).toBe(1);
      expect(searchByName[0].name).toBe("Dr. Rajesh Varma");

      const searchByRoom = await getDoctorsByHospital(SEED_HOSPITAL_ID, {
        search: "101",
      });
      expect(searchByRoom.some((d) => d.id === "doc-gm-01")).toBe(true);
    });
  });

  describe("Server Service: getDoctorById & getDoctorProfile", () => {
    it("returns null for non-existent doctor", async () => {
      const doc = await getDoctorById(SEED_HOSPITAL_ID, "non-existent-doc");
      expect(doc).toBeNull();
    });

    it("returns doctor record for valid ID", async () => {
      const doc = await getDoctorById(SEED_HOSPITAL_ID, "doc-gm-01");
      expect(doc).not.toBeNull();
      expect(doc?.name).toBe("Dr. Rajesh Varma");
      expect(doc?.qualification).toBe("MBBS, MD (General Medicine)");
    });

    it("returns full doctor profile with schedule and upcoming sessions", async () => {
      const profile = await getDoctorProfile(SEED_HOSPITAL_ID, "doc-gm-01");
      expect(profile).not.toBeNull();
      expect(profile?.name).toBe("Dr. Rajesh Varma");
      expect(profile?.schedule).toBeDefined();
      expect(profile?.schedule?.workingDays).toContain(1); // Monday
      expect(profile?.schedule?.startTime).toBe("09:00");
      expect(profile?.schedule?.endTime).toBe("17:00");
      expect(profile?.stats).toBeDefined();
      expect(typeof profile?.stats?.totalConsultations).toBe("number");
    });
  });

  describe("Server Service: createDoctor", () => {
    it("fails when assigning doctor to non-existent department", async () => {
      await expect(
        createDoctor(SEED_HOSPITAL_ID, {
          id: testDoctorId,
          name: "Dr. Phantom",
          departmentId: "non-existent-dept-xyz",
          qualification: "MBBS",
          specialization: "General",
          roomNumber: "Room 999",
          consultationDurationEstimate: 15,
        })
      ).rejects.toThrow(/Department with ID.*not found/i);
    });

    it("successfully creates a doctor under active department", async () => {
      const created = await createDoctor(SEED_HOSPITAL_ID, {
        id: testDoctorId,
        name: "Dr. Test Specialist",
        departmentId: "dept-gm",
        qualification: "MBBS, DNB",
        specialization: "Clinical Diagnostics",
        roomNumber: "Room 109",
        consultationDurationEstimate: 10,
        phone: "+91 99999 88888",
        email: "test.specialist@visakhahospital.com",
        status: "active",
        availability: "available",
      });

      expect(created.id).toBe(testDoctorId);
      expect(created.name).toBe("Dr. Test Specialist");
      expect(created.departmentName).toBe("General Medicine");
      expect(created.roomNumber).toBe("Room 109");
      expect(created.consultationDurationEstimate).toBe(10);
      expect(created.isActive).toBe(true);
    });
  });

  describe("Server Service: updateDoctor", () => {
    it("successfully updates room and consultation duration estimate", async () => {
      const updated = await updateDoctor(SEED_HOSPITAL_ID, testDoctorId, {
        roomNumber: "Room 110",
        consultationDurationEstimate: 18,
      });

      expect(updated.roomNumber).toBe("Room 110");
      expect(updated.consultationDurationEstimate).toBe(18);
    });

    it("reassigns doctor to another active department and updates departmentName", async () => {
      const updated = await updateDoctor(SEED_HOSPITAL_ID, testDoctorId, {
        departmentId: "dept-cardio",
      });

      expect(updated.departmentId).toBe("dept-cardio");
      expect(updated.departmentName).toBe("Cardiology");
    });

    it("updates doctor status and availability", async () => {
      const updated = await updateDoctor(SEED_HOSPITAL_ID, testDoctorId, {
        status: "on_leave",
        availability: "off_duty",
      });

      expect(updated.status).toBe("on_leave");
      expect(updated.availability).toBe("off_duty");
    });
  });

  describe("API Route Handlers", () => {
    it("GET /api/hospitals/[hospitalId]/doctors returns 200 with doctor list", async () => {
      const req = new NextRequest(
        `http://localhost/api/hospitals/${SEED_HOSPITAL_ID}/doctors`
      );
      const res = await getDoctorsRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(10);
    });

    it("GET /api/hospitals/[hospitalId]/doctors with department filter", async () => {
      const req = new NextRequest(
        `http://localhost/api/hospitals/${SEED_HOSPITAL_ID}/doctors?departmentId=dept-gm`
      );
      const res = await getDoctorsRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.every((d: { departmentId: string }) => d.departmentId === "dept-gm")).toBe(true);
    });

    it("POST /api/hospitals/[hospitalId]/doctors creates new doctor via API", async () => {
      const req = new NextRequest(
        `http://localhost/api/hospitals/${SEED_HOSPITAL_ID}/doctors`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: testDoctorRouteId,
            name: "Dr. Route Specialist",
            departmentId: "dept-ortho",
            qualification: "MS (Ortho)",
            specialization: "Joint Replacement",
            roomNumber: "Room 304",
            consultationDurationEstimate: 20,
            status: "active",
            availability: "available",
          }),
        }
      );

      const res = await postDoctorRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe("Dr. Route Specialist");
      expect(json.data.departmentName).toBe("Orthopedics");
    });

    it("GET /api/hospitals/[hospitalId]/doctors/[doctorId] returns doctor profile", async () => {
      const req = new NextRequest(
        `http://localhost/api/hospitals/${SEED_HOSPITAL_ID}/doctors/${testDoctorRouteId}`
      );
      const res = await getSingleDoctorRoute(req, {
        params: Promise.resolve({
          hospitalId: SEED_HOSPITAL_ID,
          doctorId: testDoctorRouteId,
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(testDoctorRouteId);
      expect(json.data.name).toBe("Dr. Route Specialist");
    });

    it("PATCH /api/hospitals/[hospitalId]/doctors/[doctorId] updates doctor", async () => {
      const req = new NextRequest(
        `http://localhost/api/hospitals/${SEED_HOSPITAL_ID}/doctors/${testDoctorRouteId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            availability: "busy",
          }),
        }
      );

      const res = await patchDoctorRoute(req, {
        params: Promise.resolve({
          hospitalId: SEED_HOSPITAL_ID,
          doctorId: testDoctorRouteId,
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.availability).toBe("busy");
    });
  });
});
