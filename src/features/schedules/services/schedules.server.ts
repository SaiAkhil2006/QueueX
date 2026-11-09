import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { serializeTimestamps } from "@/lib/firebase/timestamps";
import { nowTimestamp } from "@/lib/firebase/server-timestamps";
import {
  doctorScheduleSchema,
  createDoctorScheduleSchema,
  updateDoctorScheduleSchema,
} from "@/schemas/scheduling.schema";
import { doctorSchema } from "@/schemas/doctor.schema";
import type {
  SerializedDoctorSchedule,
  ScheduleWithDoctor,
  AvailabilityResult,
} from "../types";
import {
  validateScheduleTiming,
  calculateDoctorAvailability,
} from "../utils/availability";
import { z } from "zod";

export type CreateScheduleInput = z.infer<typeof createDoctorScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateDoctorScheduleSchema>;

/**
 * Helper to fetch a doctor lookup map for augmenting schedules with doctor details.
 */
async function getDoctorsMap(
  hospitalId: string
): Promise<Map<string, z.infer<typeof doctorSchema>>> {
  const db = getAdminFirestore();
  const snapshot = await db.collection(paths.doctors(hospitalId)).get();
  const map = new Map<string, z.infer<typeof doctorSchema>>();

  for (const doc of snapshot.docs) {
    try {
      const parsed = doctorSchema.parse({ id: doc.id, ...doc.data() });
      map.set(doc.id, parsed);
    } catch {
      // Skip unparseable records
    }
  }

  return map;
}

/**
 * Retrieves all doctor schedules for a hospital with optional filters.
 */
export async function getSchedulesByHospital(
  hospitalId: string,
  filters?: { doctorId?: string; departmentId?: string }
): Promise<ScheduleWithDoctor[]> {
  const db = getAdminFirestore();
  const [schedulesSnap, doctorsMap] = await Promise.all([
    db.collection(paths.schedules(hospitalId)).get(),
    getDoctorsMap(hospitalId),
  ]);

  const schedules: ScheduleWithDoctor[] = [];

  for (const doc of schedulesSnap.docs) {
    try {
      const parsed = doctorScheduleSchema.parse({
        id: doc.id,
        ...doc.data(),
      });

      const serialized = serializeTimestamps(
        parsed
      ) as SerializedDoctorSchedule;

      if (filters?.doctorId && serialized.doctorId !== filters.doctorId) {
        continue;
      }
      if (
        filters?.departmentId &&
        serialized.departmentId !== filters.departmentId
      ) {
        continue;
      }

      const doctor = doctorsMap.get(serialized.doctorId);

      schedules.push({
        ...serialized,
        doctorName: doctor?.name || "Doctor",
        doctorQualification: doctor?.qualification || "",
        doctorSpecialization: doctor?.specialization || "General Medicine",
        roomNumber: doctor?.roomNumber || "Unassigned",
        departmentName: doctor?.departmentName || "General",
        doctorAvailability: doctor?.availability || "available",
      });
    } catch {
      // Skip invalid documents
    }
  }

  return schedules.sort((a, b) => a.doctorName.localeCompare(b.doctorName));
}

/**
 * Retrieves a single schedule by ID.
 */
export async function getScheduleById(
  hospitalId: string,
  scheduleId: string
): Promise<ScheduleWithDoctor | null> {
  const db = getAdminFirestore();
  const docRef = db.doc(paths.schedule(hospitalId, scheduleId));
  const snap = await docRef.get();

  if (!snap.exists) {
    return null;
  }

  const parsed = doctorScheduleSchema.parse({
    id: snap.id,
    ...snap.data(),
  });

  const serialized = serializeTimestamps(parsed) as SerializedDoctorSchedule;

  // Augment with doctor data
  const doctorSnap = await db
    .doc(paths.doctor(hospitalId, serialized.doctorId))
    .get();

  let doctorName = "Doctor";
  let doctorQualification = "";
  let doctorSpecialization = "General Medicine";
  let roomNumber = "Unassigned";
  let departmentName = "General";
  let doctorAvailability = undefined;

  if (doctorSnap.exists) {
    try {
      const docData = doctorSchema.parse({
        id: doctorSnap.id,
        ...doctorSnap.data(),
      });
      doctorName = docData.name;
      doctorQualification = docData.qualification;
      doctorSpecialization = docData.specialization;
      roomNumber = docData.roomNumber;
      departmentName = docData.departmentName;
      doctorAvailability = docData.availability;
    } catch {
      // fallback
    }
  }

  return {
    ...serialized,
    doctorName,
    doctorQualification,
    doctorSpecialization,
    roomNumber,
    departmentName,
    doctorAvailability,
  };
}

/**
 * Retrieves a doctor's schedule by their doctor ID.
 */
export async function getScheduleByDoctorId(
  hospitalId: string,
  doctorId: string
): Promise<ScheduleWithDoctor | null> {
  const db = getAdminFirestore();
  const snap = await db
    .collection(paths.schedules(hospitalId))
    .where("doctorId", "==", doctorId)
    .limit(1)
    .get();

  if (snap.empty) {
    return null;
  }

  return getScheduleById(hospitalId, snap.docs[0].id);
}

/**
 * Creates or updates a doctor's schedule, ensuring time boundaries and non-overlapping breaks.
 */
export async function createOrUpdateDoctorSchedule(
  hospitalId: string,
  doctorId: string,
  input: Partial<CreateScheduleInput>
): Promise<ScheduleWithDoctor> {
  const db = getAdminFirestore();

  // 1. Verify doctor exists
  const doctorDocRef = db.doc(paths.doctor(hospitalId, doctorId));
  const doctorSnap = await doctorDocRef.get();

  if (!doctorSnap.exists) {
    throw new Error(`Doctor with ID "${doctorId}" not found`);
  }

  const doctorData = doctorSchema.parse({
    id: doctorSnap.id,
    ...doctorSnap.data(),
  });

  // 2. Validate timing & breaks
  const startTime = input.startTime || "09:00";
  const endTime = input.endTime || "17:00";
  const breakPeriods = input.breakPeriods || [];

  validateScheduleTiming(startTime, endTime, breakPeriods);

  // 3. Check if schedule already exists
  const existingSnap = await db
    .collection(paths.schedules(hospitalId))
    .where("doctorId", "==", doctorId)
    .limit(1)
    .get();

  const scheduleId = existingSnap.empty
    ? `sch-${doctorId}`
    : existingSnap.docs[0].id;

  const ts = nowTimestamp();

  if (existingSnap.empty) {
    // Validate creation schema
    const validated = createDoctorScheduleSchema.parse({
      ...input,
      hospitalId,
      doctorId,
      departmentId: doctorData.departmentId,
      workingDays: input.workingDays || [1, 2, 3, 4, 5, 6],
      startTime,
      endTime,
      maxPatientsPerSession: input.maxPatientsPerSession || 40,
      breakPeriods,
      isActive: input.isActive ?? true,
    });

    const newDoc = {
      ...validated,
      id: scheduleId,
      createdAt: ts,
      updatedAt: ts,
    };

    await db.doc(paths.schedule(hospitalId, scheduleId)).set(newDoc);
  } else {
    // Validate update
    const validated = updateDoctorScheduleSchema.parse({
      ...input,
      startTime,
      endTime,
      breakPeriods,
    });

    await db.doc(paths.schedule(hospitalId, scheduleId)).set(
      {
        ...validated,
        updatedAt: ts,
      },
      { merge: true }
    );
  }

  const result = await getScheduleById(hospitalId, scheduleId);
  if (!result) {
    throw new Error("Failed to retrieve updated doctor schedule");
  }

  return result;
}

/**
 * Checks deterministic availability for a doctor at a given date and time.
 */
export async function checkDoctorAvailability(
  hospitalId: string,
  doctorId: string,
  dateStr: string,
  timeStr?: string
): Promise<AvailabilityResult> {
  const db = getAdminFirestore();

  // 1. Fetch doctor to verify status
  const doctorSnap = await db.doc(paths.doctor(hospitalId, doctorId)).get();
  if (!doctorSnap.exists) {
    throw new Error(`Doctor with ID "${doctorId}" not found`);
  }

  const doctorData = doctorSchema.parse({
    id: doctorSnap.id,
    ...doctorSnap.data(),
  });

  // If doctor is on leave or inactive
  if (doctorData.status === "on_leave") {
    return {
      isAvailable: false,
      status: "off_duty",
      reason: `Doctor is currently on scheduled medical leave`,
      targetDate: dateStr,
      targetTime: timeStr || "Now",
      dayOfWeek: new Date(`${dateStr}T12:00:00Z`).getDay(),
      dayName: "Leave",
    };
  }

  if (doctorData.status === "inactive" || doctorData.isActive === false) {
    return {
      isAvailable: false,
      status: "inactive",
      reason: `Doctor record is inactive in the hospital registry`,
      targetDate: dateStr,
      targetTime: timeStr || "Now",
      dayOfWeek: new Date(`${dateStr}T12:00:00Z`).getDay(),
      dayName: "Inactive",
    };
  }

  // 2. Fetch doctor schedule
  const schedule = await getScheduleByDoctorId(hospitalId, doctorId);

  return calculateDoctorAvailability(schedule, dateStr, timeStr);
}
