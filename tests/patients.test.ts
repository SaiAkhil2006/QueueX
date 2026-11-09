import { describe, it, expect, afterAll } from "vitest";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
} from "@/features/patients/services/patients.server";

describe("Phase 2: Patient Registry & UHID Management", () => {
  const db = getAdminFirestore();
  const timestamp = Date.now().toString().slice(-6);
  const testPatientId = `pat-test-${timestamp}`;

  afterAll(async () => {
    await db.doc(paths.patient(SEED_HOSPITAL_ID, testPatientId)).delete().catch(() => {});
  });

  describe("Server Service: getPatients", () => {
    it("retrieves seeded patients from Firestore", async () => {
      const patients = await getPatients(SEED_HOSPITAL_ID, { limit: 20 });
      expect(patients.length).toBeGreaterThan(0);
      const first = patients[0];
      expect(first.uhid).toBeDefined();
      expect(first.name).toBeDefined();
    });

    it("searches patients by phone number or name", async () => {
      const results = await getPatients(SEED_HOSPITAL_ID, { search: "98480" });
      expect(results.length).toBeGreaterThan(0);
      results.forEach((p) => {
        const matches =
          p.phone.includes("98480") ||
          p.name.toLowerCase().includes("98480") ||
          p.uhid.toLowerCase().includes("98480");
        expect(matches).toBe(true);
      });
    });

    it("filters patients by gender and status", async () => {
      const femalePatients = await getPatients(SEED_HOSPITAL_ID, {
        gender: "female",
        status: "active",
      });
      femalePatients.forEach((p) => {
        expect(p.gender).toBe("female");
        expect(p.status).toBe("active");
      });
    });
  });

  describe("Server Service: createPatient & UHID Generation", () => {
    it("registers a new patient and generates a valid UHID", async () => {
      const created = await createPatient(SEED_HOSPITAL_ID, {
        id: testPatientId,
        name: `Test Patient ${timestamp}`,
        age: 35,
        gender: "male",
        phone: `+91 91234 ${timestamp.slice(-5)}`,
        bloodGroup: "O+",
        status: "active",
        emergencyContact: {
          name: "Test Spouse",
          phone: "+91 91234 99999",
          relation: "Spouse",
        },
      });

      expect(created.id).toBe(testPatientId);
      expect(created.uhid).toMatch(/^QX-\d{4}-\d{4}/);
      expect(created.name).toBe(`Test Patient ${timestamp}`);
      expect(created.bloodGroup).toBe("O+");
    });

    it("rejects duplicate UHID creation", async () => {
      const existingSnap = await db.collection(paths.patients(SEED_HOSPITAL_ID)).limit(1).get();
      const existingUHID = existingSnap.docs[0].data().uhid;

      await expect(
        createPatient(SEED_HOSPITAL_ID, {
          name: "Duplicate UHID Patient",
          uhid: existingUHID,
          age: 40,
          gender: "female",
          phone: "+91 99999 88888",
        })
      ).rejects.toThrow(/already exists/i);
    });
  });

  describe("Server Service: getPatientById", () => {
    it("retrieves full patient details with appointment history", async () => {
      const patient = await getPatientById(SEED_HOSPITAL_ID, testPatientId);
      expect(patient).not.toBeNull();
      expect(patient?.id).toBe(testPatientId);
      expect(patient?.appointments).toBeDefined();
      expect(Array.isArray(patient?.appointments)).toBe(true);
      expect(patient?.consultations).toBeDefined();
    });

    it("returns null for non-existent patient", async () => {
      const patient = await getPatientById(SEED_HOSPITAL_ID, "pat-non-existent-999");
      expect(patient).toBeNull();
    });
  });

  describe("Server Service: updatePatient", () => {
    it("updates patient phone and blood group", async () => {
      const updated = await updatePatient(SEED_HOSPITAL_ID, testPatientId, {
        phone: "+91 98765 43210",
        bloodGroup: "AB+",
      });

      expect(updated.phone).toBe("+91 98765 43210");
      expect(updated.bloodGroup).toBe("AB+");
    });
  });
});
