import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { serializeTimestamps } from "@/lib/firebase/timestamps";
import { nowTimestamp } from "@/lib/firebase/server-timestamps";
import {
  doctorSchema,
  createDoctorSchema,
  updateDoctorSchema,
} from "@/schemas/doctor.schema";
import { departmentSchema } from "@/schemas/department.schema";
import { doctorScheduleSchema, opdSessionSchema } from "@/schemas/scheduling.schema";
import type {
  SerializedDoctor,
  DoctorProfile,
  DoctorFilterOptions,
} from "../types";
import { z } from "zod";

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;

/**
 * Retrieves doctors for a hospital with optional in-memory filtering.
 */
export async function getDoctorsByHospital(
  hospitalId: string,
  filters?: DoctorFilterOptions
): Promise<SerializedDoctor[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection(paths.doctors(hospitalId)).get();

  const doctors: SerializedDoctor[] = [];

  for (const doc of snapshot.docs) {
    const parsed = doctorSchema.parse({
      id: doc.id,
      ...doc.data(),
    });

    const serialized = serializeTimestamps(parsed) as SerializedDoctor;

    // Apply filtering
    if (filters?.departmentId && serialized.departmentId !== filters.departmentId) {
      continue;
    }
    if (filters?.availability && serialized.availability !== filters.availability) {
      continue;
    }
    if (filters?.status && serialized.status !== filters.status) {
      continue;
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      const match =
        serialized.name.toLowerCase().includes(q) ||
        serialized.specialization.toLowerCase().includes(q) ||
        serialized.departmentName.toLowerCase().includes(q) ||
        serialized.roomNumber.toLowerCase().includes(q);
      if (!match) continue;
    }

    doctors.push(serialized);
  }

  return doctors.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Retrieves a doctor by ID.
 */
export async function getDoctorById(
  hospitalId: string,
  doctorId: string
): Promise<SerializedDoctor | null> {
  const db = getAdminFirestore();
  const docRef = db.doc(paths.doctor(hospitalId, doctorId));
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const parsed = doctorSchema.parse({
    id: snapshot.id,
    ...snapshot.data(),
  });

  return serializeTimestamps(parsed) as SerializedDoctor;
}

/**
 * Retrieves a full doctor profile including schedule and upcoming sessions.
 */
export async function getDoctorProfile(
  hospitalId: string,
  doctorId: string
): Promise<DoctorProfile | null> {
  const doctor = await getDoctorById(hospitalId, doctorId);
  if (!doctor) return null;

  const db = getAdminFirestore();

  // 1. Fetch weekly schedule
  const scheduleSnapshot = await db
    .collection(paths.schedules(hospitalId))
    .where("doctorId", "==", doctorId)
    .limit(1)
    .get();

  let schedule = null;
  if (!scheduleSnapshot.empty) {
    const rawSch = scheduleSnapshot.docs[0].data();
    const parsedSch = doctorScheduleSchema.parse({
      id: scheduleSnapshot.docs[0].id,
      ...rawSch,
    });
    schedule = serializeTimestamps(parsedSch);
  }

  // 2. Fetch upcoming and active sessions
  const sessionsSnapshot = await db
    .collection(paths.sessions(hospitalId))
    .where("doctorId", "==", doctorId)
    .get();

  const sessions = sessionsSnapshot.docs
    .map((doc) => {
      return serializeTimestamps(
        opdSessionSchema.parse({ id: doc.id, ...doc.data() })
      );
    })
    .filter((s) => s.status === "scheduled" || s.status === "active")
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

  // 3. Aggregate consultations count
  const consultSnapshot = await db
    .collection(paths.consultations(hospitalId))
    .where("doctorId", "==", doctorId)
    .get();

  return {
    ...doctor,
    schedule,
    upcomingSessions: sessions.slice(0, 5),
    stats: {
      totalConsultations: consultSnapshot.size,
      completedToday: sessions.filter((s) => s.status === "completed").length,
    },
  };
}

/**
 * Registers a new doctor after verifying the target department is active.
 */
export async function createDoctor(
  hospitalId: string,
  input: Partial<CreateDoctorInput>
): Promise<SerializedDoctor> {
  const db = getAdminFirestore();

  if (!input.departmentId) {
    throw new Error("Department ID is required");
  }

  // Verify department exists and is active
  const deptDocRef = db.doc(paths.department(hospitalId, input.departmentId));
  const deptSnapshot = await deptDocRef.get();

  if (!deptSnapshot.exists) {
    throw new Error(`Department with ID "${input.departmentId}" not found`);
  }

  const deptData = departmentSchema.parse({
    id: deptSnapshot.id,
    ...deptSnapshot.data(),
  });

  if (deptData.status === "inactive" || deptData.isActive === false) {
    throw new Error(
      `Cannot assign doctor to inactive department "${deptData.name}". Reactivate the department first.`
    );
  }

  // Ensure departmentName is populated
  const validated = createDoctorSchema.parse({
    ...input,
    hospitalId,
    departmentName: deptData.name,
  });

  const generatedId =
    validated.id ||
    `doc-${deptData.code.toLowerCase()}-${Date.now().toString().slice(-4)}`;

  const ts = nowTimestamp();
  const newDoctorData = {
    ...validated,
    id: generatedId,
    hospitalId,
    status: validated.status || "active",
    availability: validated.availability || "available",
    isActive: validated.status !== "inactive",
    createdAt: ts,
    updatedAt: ts,
  };

  const docRef = db.doc(paths.doctor(hospitalId, generatedId));
  await docRef.set(newDoctorData);

  const created = await getDoctorById(hospitalId, generatedId);
  if (!created) {
    throw new Error("Failed to verify created doctor in Firestore");
  }

  return created;
}

/**
 * Updates a doctor's details and manages department reassignment.
 */
export async function updateDoctor(
  hospitalId: string,
  doctorId: string,
  input: UpdateDoctorInput
): Promise<SerializedDoctor> {
  const validated = updateDoctorSchema.parse(input);
  const db = getAdminFirestore();
  const docRef = db.doc(paths.doctor(hospitalId, doctorId));

  const existing = await docRef.get();
  if (!existing.exists) {
    throw new Error(`Doctor with ID "${doctorId}" not found`);
  }

  const updateData: Record<string, unknown> = {
    ...validated,
    updatedAt: nowTimestamp(),
  };

  // If department reassignment is requested, verify target department
  if (validated.departmentId) {
    const deptRef = db.doc(paths.department(hospitalId, validated.departmentId));
    const deptSnap = await deptRef.get();
    if (!deptSnap.exists) {
      throw new Error(`Target department "${validated.departmentId}" does not exist`);
    }

    const deptData = departmentSchema.parse({
      id: deptSnap.id,
      ...deptSnap.data(),
    });

    if (deptData.status === "inactive" || deptData.isActive === false) {
      throw new Error(
        `Cannot reassign doctor to inactive department "${deptData.name}"`
      );
    }

    updateData.departmentId = deptData.id;
    updateData.departmentName = deptData.name;
  }

  if (validated.status) {
    updateData.isActive = validated.status !== "inactive";
  }

  await docRef.set(updateData, { merge: true });

  const updated = await getDoctorById(hospitalId, doctorId);
  if (!updated) {
    throw new Error("Failed to retrieve updated doctor record");
  }

  return updated;
}
