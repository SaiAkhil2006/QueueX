import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { nowTimestamp, toFirestoreTimestamp } from "@/lib/firebase/server-timestamps";
import type { Appointment, CreateAppointmentInput, AvailableSlot, CreateWalkInInput } from "../types";
import type { Doctor } from "@/types/doctor";
import type { Department } from "@/types/department";
import type { Patient } from "@/types/patient";
import type { DoctorSchedule } from "@/types/scheduling";

/**
 * Retrieve appointments with optional filtering.
 */
export async function getAppointments(
  hospitalId: string,
  filters?: {
    date?: string;
    doctorId?: string;
    departmentId?: string;
    patientId?: string;
    status?: string;
    limit?: number;
  }
): Promise<Appointment[]> {
  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection(paths.appointments(hospitalId)).limit(filters?.limit || 150);

  if (filters?.date) {
    query = query.where("scheduledDate", "==", filters.date);
  }
  if (filters?.doctorId) {
    query = query.where("doctorId", "==", filters.doctorId);
  }
  if (filters?.departmentId) {
    query = query.where("departmentId", "==", filters.departmentId);
  }
  if (filters?.patientId) {
    query = query.where("patientId", "==", filters.patientId);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.where("status", "==", filters.status);
  }

  const snapshot = await query.get();
  const appointments: Appointment[] = snapshot.docs.map((d) => d.data() as Appointment);

  // Chronological sort: date asc, time asc
  return appointments.sort((a, b) =>
    (a.scheduledDate + a.scheduledTime).localeCompare(b.scheduledDate + b.scheduledTime)
  );
}

/**
 * Retrieve single appointment by ID.
 */
export async function getAppointmentById(
  hospitalId: string,
  appointmentId: string
): Promise<Appointment | null> {
  const db = getAdminFirestore();
  const docRef = db.doc(paths.appointment(hospitalId, appointmentId));
  const snapshot = await docRef.get();
  if (!snapshot.exists) return null;
  return snapshot.data() as Appointment;
}

/**
 * Generate available booking time slots for a doctor on a specific date.
 */
export async function getAvailableSlots(
  hospitalId: string,
  params: { doctorId: string; date: string }
): Promise<AvailableSlot[]> {
  const db = getAdminFirestore();
  const { doctorId, date } = params;

  // 1. Fetch Doctor
  const doctorSnap = await db.doc(paths.doctor(hospitalId, doctorId)).get();
  if (!doctorSnap.exists) {
    throw new Error(`Doctor '${doctorId}' not found.`);
  }
  const doctor = doctorSnap.data() as Doctor;
  if (!doctor.isActive || doctor.status !== "active") {
    return [];
  }

  // 2. Fetch Department
  const deptSnap = await db.doc(paths.department(hospitalId, doctor.departmentId)).get();
  if (!deptSnap.exists) {
    throw new Error(`Department '${doctor.departmentId}' not found.`);
  }
  const department = deptSnap.data() as Department;
  if (!department.isActive || department.status !== "active") {
    return [];
  }

  // 3. Determine schedule
  let shiftStart = "09:00";
  let shiftEnd = "17:00";
  let breakStart = "13:00";
  let breakEnd = "14:00";
  const slotDuration = doctor.consultationDurationEstimate || department.avgConsultationDurationMinutes || 15;

  const scheduleSnap = await db.doc(paths.schedule(hospitalId, `sch-${doctorId}`)).get();
  if (scheduleSnap.exists) {
    const schedule = scheduleSnap.data() as DoctorSchedule;
    const dateObj = new Date(date + "T00:00:00");
    const dayOfWeek = dateObj.getDay();

    if (schedule.workingDays && !schedule.workingDays.includes(dayOfWeek)) {
      return []; // Doctor is not scheduled to work on this day
    }

    if (schedule.startTime) shiftStart = schedule.startTime;
    if (schedule.endTime) shiftEnd = schedule.endTime;

    if (schedule.breakPeriods && schedule.breakPeriods.length > 0) {
      breakStart = schedule.breakPeriods[0].startTime;
      breakEnd = schedule.breakPeriods[0].endTime;
    }
  }

  // 4. Generate candidate time intervals
  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };
  const toTimeString = (totalMinutes: number) => {
    const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const m = String(totalMinutes % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  const startMin = toMinutes(shiftStart);
  const endMin = toMinutes(shiftEnd);
  const bStartMin = toMinutes(breakStart);
  const bEndMin = toMinutes(breakEnd);

  const rawSlots: string[] = [];
  for (let current = startMin; current + slotDuration <= endMin; current += slotDuration) {
    // Check if slot falls in break
    const slotEnd = current + slotDuration;
    const overlapsBreak = Math.max(current, bStartMin) < Math.min(slotEnd, bEndMin);
    if (!overlapsBreak) {
      rawSlots.push(toTimeString(current));
    }
  }

  // 5. Query existing booked appointments on this date
  const existingSnap = await db
    .collection(paths.appointments(hospitalId))
    .where("doctorId", "==", doctorId)
    .where("scheduledDate", "==", date)
    .get();

  const activeBookings = new Set<string>();
  existingSnap.docs.forEach((d) => {
    const apt = d.data() as Appointment;
    if (apt.status !== "cancelled" && apt.status !== "no_show") {
      activeBookings.add(apt.scheduledTime);
    }
  });

  return rawSlots.map((time) => {
    const isBooked = activeBookings.has(time);
    return {
      time,
      available: !isBooked,
      reason: isBooked ? "Booked" : undefined,
      doctorId,
      date,
    };
  });
}

/**
 * Book an appointment with validation and conflict prevention.
 */
export async function createAppointment(
  hospitalId: string,
  input: CreateAppointmentInput
): Promise<Appointment> {
  const db = getAdminFirestore();

  // 1. Validate Patient
  const patientSnap = await db.doc(paths.patient(hospitalId, input.patientId)).get();
  if (!patientSnap.exists) {
    throw new Error(`Patient '${input.patientId}' not found.`);
  }
  const patient = patientSnap.data() as Patient;

  // 2. Validate Doctor
  const doctorSnap = await db.doc(paths.doctor(hospitalId, input.doctorId)).get();
  if (!doctorSnap.exists) {
    throw new Error(`Doctor '${input.doctorId}' not found.`);
  }
  const doctor = doctorSnap.data() as Doctor;
  if (!doctor.isActive || doctor.status !== "active") {
    throw new Error(`Doctor '${doctor.name}' is currently inactive and cannot accept appointments.`);
  }

  // 3. Validate Department
  const deptSnap = await db.doc(paths.department(hospitalId, doctor.departmentId)).get();
  if (!deptSnap.exists) {
    throw new Error(`Department '${doctor.departmentId}' not found.`);
  }
  const department = deptSnap.data() as Department;
  if (!department.isActive || department.status !== "active") {
    throw new Error(`Department '${department.name}' is currently inactive.`);
  }

  // 4. Validate Conflict Prevention (no duplicate booking at the same date/time)
  const conflictSnap = await db
    .collection(paths.appointments(hospitalId))
    .where("doctorId", "==", input.doctorId)
    .where("scheduledDate", "==", input.scheduledDate)
    .where("scheduledTime", "==", input.scheduledTime)
    .get();

  const hasConflict = conflictSnap.docs.some((doc) => {
    const apt = doc.data() as Appointment;
    return apt.status !== "cancelled" && apt.status !== "no_show";
  });

  if (hasConflict) {
    throw new Error(
      `Conflicting booking: Doctor '${doctor.name}' already has an active appointment at ${input.scheduledTime} on ${input.scheduledDate}.`
    );
  }

  // 5. Construct timestamp
  const scheduledDateObj = new Date(`${input.scheduledDate}T${input.scheduledTime}:00`);
  const scheduledAt = toFirestoreTimestamp(scheduledDateObj);

  const appointmentId = input.id || `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const now = nowTimestamp();
  const appointmentRecord: Record<string, unknown> = {
    id: appointmentId,
    hospitalId,
    patientId: input.patientId,
    patientName: input.patientName || patient.name,
    patientPhone: input.patientPhone || patient.phone,
    doctorId: input.doctorId,
    doctorName: doctor.name,
    departmentId: doctor.departmentId,
    departmentName: department.name,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    scheduledAt,
    appointmentType: input.appointmentType || "regular",
    status: input.status || "booked",
    tokenNumber: input.tokenNumber ?? null,
    queueEntryId: input.queueEntryId ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = db.doc(paths.appointment(hospitalId, appointmentId));
  await docRef.set(appointmentRecord);

  const createdSnap = await docRef.get();
  return createdSnap.data() as Appointment;
}

/**
 * Register a Walk-in Appointment for today and automatically mark as checked_in.
 */
export async function createWalkInAppointment(
  hospitalId: string,
  input: CreateWalkInInput
): Promise<Appointment> {
  const db = getAdminFirestore();

  const patientSnap = await db.doc(paths.patient(hospitalId, input.patientId)).get();
  if (!patientSnap.exists) {
    throw new Error(`Patient '${input.patientId}' not found.`);
  }
  const patient = patientSnap.data() as Patient;

  const doctorSnap = await db.doc(paths.doctor(hospitalId, input.doctorId)).get();
  if (!doctorSnap.exists) {
    throw new Error(`Doctor '${input.doctorId}' not found.`);
  }
  const doctor = doctorSnap.data() as Doctor;

  const deptSnap = await db.doc(paths.department(hospitalId, doctor.departmentId)).get();
  const department = deptSnap.exists ? (deptSnap.data() as Department) : null;

  // Use current local time formatted in YYYY-MM-DD and HH:MM
  const nowObj = new Date();
  const yyyy = nowObj.getFullYear();
  const mm = String(nowObj.getMonth() + 1).padStart(2, "0");
  const dd = String(nowObj.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const hh = String(nowObj.getHours()).padStart(2, "0");
  const min = String(nowObj.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${min}`;

  const appointmentId = `apt-walkin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = nowTimestamp();

  const appointmentRecord: Record<string, unknown> = {
    id: appointmentId,
    hospitalId,
    patientId: input.patientId,
    patientName: patient.name,
    patientPhone: patient.phone,
    doctorId: input.doctorId,
    doctorName: doctor.name,
    departmentId: doctor.departmentId,
    departmentName: department?.name || "General OPD",
    scheduledDate: todayStr,
    scheduledTime: timeStr,
    scheduledAt: toFirestoreTimestamp(nowObj),
    appointmentType: "walk_in",
    status: "checked_in",
    tokenNumber: null,
    queueEntryId: null,
    notes: input.notes || "Walk-in patient registration",
    createdAt: now,
    updatedAt: now,
  };

  const docRef = db.doc(paths.appointment(hospitalId, appointmentId));
  await docRef.set(appointmentRecord);

  const createdSnap = await docRef.get();
  return createdSnap.data() as Appointment;
}

/**
 * Cancel an appointment.
 */
export async function cancelAppointment(
  hospitalId: string,
  appointmentId: string,
  reason?: string
): Promise<Appointment> {
  const db = getAdminFirestore();
  const docRef = db.doc(paths.appointment(hospitalId, appointmentId));
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error(`Appointment '${appointmentId}' not found.`);
  }

  const existing = snapshot.data() as Appointment;
  if (existing.status === "completed") {
    throw new Error("Cannot cancel an already completed appointment.");
  }

  const updatePayload: Record<string, unknown> = {
    status: "cancelled",
    notes: reason ? `${existing.notes || ""}\nCancellation reason: ${reason}`.trim() : existing.notes,
    updatedAt: nowTimestamp(),
  };

  await docRef.update(updatePayload);
  const updatedSnap = await docRef.get();
  return updatedSnap.data() as Appointment;
}

/**
 * Reschedule an appointment to a new date and time slot.
 */
export async function rescheduleAppointment(
  hospitalId: string,
  appointmentId: string,
  newDate: string,
  newTime: string
): Promise<Appointment> {
  const db = getAdminFirestore();
  const docRef = db.doc(paths.appointment(hospitalId, appointmentId));
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error(`Appointment '${appointmentId}' not found.`);
  }

  const existing = snapshot.data() as Appointment;

  // Conflict check for new slot
  const conflictSnap = await db
    .collection(paths.appointments(hospitalId))
    .where("doctorId", "==", existing.doctorId)
    .where("scheduledDate", "==", newDate)
    .where("scheduledTime", "==", newTime)
    .get();

  const hasConflict = conflictSnap.docs.some(
    (d) => d.id !== appointmentId && d.data().status !== "cancelled" && d.data().status !== "no_show"
  );

  if (hasConflict) {
    throw new Error(
      `Slot ${newTime} on ${newDate} is already booked for Dr. ${existing.doctorName}.`
    );
  }

  const newScheduledDateObj = new Date(`${newDate}T${newTime}:00`);
  const updatePayload: Record<string, unknown> = {
    scheduledDate: newDate,
    scheduledTime: newTime,
    scheduledAt: toFirestoreTimestamp(newScheduledDateObj),
    status: "booked",
    updatedAt: nowTimestamp(),
  };

  await docRef.update(updatePayload);
  const updatedSnap = await docRef.get();
  return updatedSnap.data() as Appointment;
}

/**
 * Check-in an appointment (converting to checked_in status).
 */
export async function checkInAppointment(
  hospitalId: string,
  appointmentId: string
): Promise<Appointment> {
  const db = getAdminFirestore();
  const docRef = db.doc(paths.appointment(hospitalId, appointmentId));
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error(`Appointment '${appointmentId}' not found.`);
  }

  const existing = snapshot.data() as Appointment;
  if (existing.status === "cancelled" || existing.status === "completed") {
    throw new Error(`Cannot check in an appointment with status '${existing.status}'.`);
  }

  const updatePayload: Record<string, unknown> = {
    status: "checked_in",
    updatedAt: nowTimestamp(),
  };

  await docRef.update(updatePayload);
  const updatedSnap = await docRef.get();
  return updatedSnap.data() as Appointment;
}
