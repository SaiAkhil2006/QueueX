import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { serializeTimestamps } from "@/lib/firebase/timestamps";
import { nowTimestamp } from "@/lib/firebase/server-timestamps";
import {
  departmentSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
} from "@/schemas/department.schema";
import type { DepartmentWithStats } from "../types";
import { z } from "zod";

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

/**
 * Retrieves all departments for a hospital with live assigned doctor counts.
 */
export async function getDepartmentsByHospital(
  hospitalId: string
): Promise<DepartmentWithStats[]> {
  const db = getAdminFirestore();

  // 1. Fetch all departments
  const deptSnapshot = await db.collection(paths.departments(hospitalId)).get();

  // 2. Fetch doctors to aggregate doctor counts per department
  const doctorSnapshot = await db.collection(paths.doctors(hospitalId)).get();

  const doctorCounts: Record<string, { total: number; active: number }> = {};
  for (const doc of doctorSnapshot.docs) {
    const data = doc.data();
    const dId = data.departmentId as string;
    if (!doctorCounts[dId]) {
      doctorCounts[dId] = { total: 0, active: 0 };
    }
    doctorCounts[dId].total++;
    if (data.status === "active" && data.isActive !== false) {
      doctorCounts[dId].active++;
    }
  }

  const departments: DepartmentWithStats[] = [];

  for (const doc of deptSnapshot.docs) {
    const parsed = departmentSchema.parse({
      id: doc.id,
      ...doc.data(),
    });

    const stats = doctorCounts[doc.id] || { total: 0, active: 0 };

    departments.push({
      ...(serializeTimestamps(parsed) as DepartmentWithStats),
      doctorCount: stats.total,
      activeDoctorCount: stats.active,
    });
  }

  // Sort alphabetically by name
  return departments.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Retrieves a single department by ID with assigned doctor counts.
 */
export async function getDepartmentById(
  hospitalId: string,
  departmentId: string
): Promise<DepartmentWithStats | null> {
  const db = getAdminFirestore();
  const docRef = db.doc(paths.department(hospitalId, departmentId));
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const parsed = departmentSchema.parse({
    id: snapshot.id,
    ...snapshot.data(),
  });

  // Count doctors in this department
  const doctorSnapshot = await db
    .collection(paths.doctors(hospitalId))
    .where("departmentId", "==", departmentId)
    .get();

  let activeCount = 0;
  for (const doc of doctorSnapshot.docs) {
    const data = doc.data();
    if (data.status === "active" && data.isActive !== false) {
      activeCount++;
    }
  }

  return {
    ...(serializeTimestamps(parsed) as DepartmentWithStats),
    doctorCount: doctorSnapshot.size,
    activeDoctorCount: activeCount,
  };
}

/**
 * Creates a new department, enforcing unique department names within the hospital.
 */
export async function createDepartment(
  hospitalId: string,
  input: Partial<CreateDepartmentInput>
): Promise<DepartmentWithStats> {
  const validated = createDepartmentSchema.parse({
    ...input,
    hospitalId: input.hospitalId || hospitalId,
  });
  const db = getAdminFirestore();

  // Enforce unique name within hospital (case-insensitive)
  const existingDeptQuery = await db
    .collection(paths.departments(hospitalId))
    .get();

  const nameLower = validated.name.trim().toLowerCase();
  const codeUpper = validated.code.trim().toUpperCase();

  for (const doc of existingDeptQuery.docs) {
    const data = doc.data();
    if ((data.name as string)?.trim().toLowerCase() === nameLower) {
      throw new Error(`A department with the name "${validated.name}" already exists`);
    }
    if ((data.code as string)?.trim().toUpperCase() === codeUpper) {
      throw new Error(`A department with the code "${validated.code}" already exists`);
    }
  }

  const generatedId =
    validated.id || `dept-${codeUpper.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

  const ts = nowTimestamp();
  const newDeptData = {
    ...validated,
    id: generatedId,
    hospitalId,
    code: codeUpper,
    name: validated.name.trim(),
    status: validated.status || "active",
    isActive: validated.status !== "inactive",
    createdAt: ts,
    updatedAt: ts,
  };

  const docRef = db.doc(paths.department(hospitalId, generatedId));
  await docRef.set(newDeptData);

  const created = await getDepartmentById(hospitalId, generatedId);
  if (!created) {
    throw new Error("Failed to verify created department in Firestore");
  }

  return created;
}

/**
 * Updates department details, enforcing uniqueness if name or code changes.
 */
export async function updateDepartment(
  hospitalId: string,
  departmentId: string,
  input: UpdateDepartmentInput
): Promise<DepartmentWithStats> {
  const validated = updateDepartmentSchema.parse(input);
  const db = getAdminFirestore();
  const docRef = db.doc(paths.department(hospitalId, departmentId));

  const existing = await docRef.get();
  if (!existing.exists) {
    throw new Error(`Department with ID "${departmentId}" not found`);
  }

  // If name or code is modified, ensure uniqueness against all other departments
  if (validated.name || validated.code) {
    const existingDeptQuery = await db
      .collection(paths.departments(hospitalId))
      .get();

    for (const doc of existingDeptQuery.docs) {
      if (doc.id === departmentId) continue;
      const data = doc.data();

      if (
        validated.name &&
        (data.name as string)?.trim().toLowerCase() ===
          validated.name.trim().toLowerCase()
      ) {
        throw new Error(
          `Another department with the name "${validated.name}" already exists`
        );
      }
      if (
        validated.code &&
        (data.code as string)?.trim().toUpperCase() ===
          validated.code.trim().toUpperCase()
      ) {
        throw new Error(
          `Another department with the code "${validated.code}" already exists`
        );
      }
    }
  }

  const updateData: Record<string, unknown> = {
    ...validated,
    updatedAt: nowTimestamp(),
  };

  if (validated.status) {
    updateData.isActive = validated.status === "active";
  }

  if (validated.code) {
    updateData.code = validated.code.trim().toUpperCase();
  }

  await docRef.set(updateData, { merge: true });

  const updated = await getDepartmentById(hospitalId, departmentId);
  if (!updated) {
    throw new Error("Failed to retrieve updated department from Firestore");
  }

  return updated;
}
