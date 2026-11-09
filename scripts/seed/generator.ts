import { hospitalSchema } from "@/schemas/hospital.schema";
import { departmentSchema } from "@/schemas/department.schema";
import { doctorSchema } from "@/schemas/doctor.schema";
import { doctorScheduleSchema, opdSessionSchema } from "@/schemas/scheduling.schema";
import { patientSchema } from "@/schemas/patient.schema";
import { appointmentSchema } from "@/schemas/appointment.schema";
import { consultationSchema } from "@/schemas/consultation.schema";

import { generateSeedHospital } from "./hospital.seed";
import { generateSeedDepartments } from "./departments.seed";
import { generateSeedDoctors } from "./doctors.seed";
import { generateSeedSchedules } from "./schedules.seed";
import { generateSeedSessions } from "./sessions.seed";
import { generateSeedPatients } from "./patients.seed";
import { generateSeedAppointments } from "./appointments.seed";
import { generateSeedConsultations } from "./consultations.seed";

import type {
  SeedDataset,
  SeedOptions,
  SeedValidationReport,
} from "./types";

/**
 * Pure generator function that produces the complete synthetic hospital dataset.
 * Runs completely in-memory without requiring any network or database connection.
 */
export function generateSeedDataset(options?: SeedOptions): SeedDataset {
  const baseDate = options?.baseDate ?? new Date();

  const hospital = generateSeedHospital(baseDate);
  const departments = generateSeedDepartments(hospital.id, baseDate);
  const doctors = generateSeedDoctors(hospital.id, baseDate);
  const schedules = generateSeedSchedules(hospital.id, baseDate);
  const sessions = generateSeedSessions(hospital.id, baseDate);
  const patients = generateSeedPatients(hospital.id, baseDate);
  const appointments = generateSeedAppointments(patients, doctors, hospital.id, baseDate);
  const consultations = generateSeedConsultations(
    patients,
    doctors,
    sessions,
    hospital.id,
    baseDate
  );

  return {
    hospital,
    departments,
    doctors,
    schedules,
    sessions,
    patients,
    appointments,
    consultations,
  };
}

/**
 * Validates all entities within a seed dataset against their respective Zod schemas
 * and verifies referential integrity across collections.
 */
export function validateSeedDataset(dataset: SeedDataset): SeedValidationReport {
  const errors: string[] = [];

  // 1. Validate Hospital
  const hRes = hospitalSchema.safeParse(dataset.hospital);
  if (!hRes.success) {
    errors.push(`Hospital [${dataset.hospital.id}]: ${hRes.error.message}`);
  }

  // 2. Validate Departments
  const deptIds = new Set<string>();
  for (const dept of dataset.departments) {
    const dRes = departmentSchema.safeParse(dept);
    if (!dRes.success) {
      errors.push(`Department [${dept.id}]: ${dRes.error.message}`);
    }
    if (dept.hospitalId !== dataset.hospital.id) {
      errors.push(`Department [${dept.id}] references invalid hospitalId: ${dept.hospitalId}`);
    }
    deptIds.add(dept.id);
  }

  // 3. Validate Doctors
  const docIds = new Set<string>();
  for (const doc of dataset.doctors) {
    const dRes = doctorSchema.safeParse(doc);
    if (!dRes.success) {
      errors.push(`Doctor [${doc.id}]: ${dRes.error.message}`);
    }
    if (!deptIds.has(doc.departmentId)) {
      errors.push(`Doctor [${doc.id}] references missing departmentId: ${doc.departmentId}`);
    }
    docIds.add(doc.id);
  }

  // 4. Validate Schedules
  for (const sch of dataset.schedules) {
    const sRes = doctorScheduleSchema.safeParse(sch);
    if (!sRes.success) {
      errors.push(`Schedule [${sch.id}]: ${sRes.error.message}`);
    }
    if (!docIds.has(sch.doctorId)) {
      errors.push(`Schedule [${sch.id}] references missing doctorId: ${sch.doctorId}`);
    }
    if (!deptIds.has(sch.departmentId)) {
      errors.push(`Schedule [${sch.id}] references missing departmentId: ${sch.departmentId}`);
    }
  }

  // 5. Validate Sessions
  const sessionIds = new Set<string>();
  for (const ses of dataset.sessions) {
    const sRes = opdSessionSchema.safeParse(ses);
    if (!sRes.success) {
      errors.push(`Session [${ses.id}]: ${sRes.error.message}`);
    }
    if (!docIds.has(ses.doctorId)) {
      errors.push(`Session [${ses.id}] references missing doctorId: ${ses.doctorId}`);
    }
    if (!deptIds.has(ses.departmentId)) {
      errors.push(`Session [${ses.id}] references missing departmentId: ${ses.departmentId}`);
    }
    sessionIds.add(ses.id);
  }

  // 6. Validate Patients
  const patientIds = new Set<string>();
  for (const pat of dataset.patients) {
    const pRes = patientSchema.safeParse(pat);
    if (!pRes.success) {
      errors.push(`Patient [${pat.id}]: ${pRes.error.message}`);
    }
    patientIds.add(pat.id);
  }

  // 7. Validate Appointments
  for (const apt of dataset.appointments) {
    const aRes = appointmentSchema.safeParse(apt);
    if (!aRes.success) {
      errors.push(`Appointment [${apt.id}]: ${aRes.error.message}`);
    }
    if (!patientIds.has(apt.patientId)) {
      errors.push(`Appointment [${apt.id}] references missing patientId: ${apt.patientId}`);
    }
    if (!docIds.has(apt.doctorId)) {
      errors.push(`Appointment [${apt.id}] references missing doctorId: ${apt.doctorId}`);
    }
    if (!deptIds.has(apt.departmentId)) {
      errors.push(`Appointment [${apt.id}] references missing departmentId: ${apt.departmentId}`);
    }
  }

  // 8. Validate Consultations
  for (const cns of dataset.consultations) {
    const cRes = consultationSchema.safeParse(cns);
    if (!cRes.success) {
      errors.push(`Consultation [${cns.id}]: ${cRes.error.message}`);
    }
    if (!patientIds.has(cns.patientId)) {
      errors.push(`Consultation [${cns.id}] references missing patientId: ${cns.patientId}`);
    }
    if (!docIds.has(cns.doctorId)) {
      errors.push(`Consultation [${cns.id}] references missing doctorId: ${cns.doctorId}`);
    }
    if (!deptIds.has(cns.departmentId)) {
      errors.push(`Consultation [${cns.id}] references missing departmentId: ${cns.departmentId}`);
    }
    if (!sessionIds.has(cns.sessionId)) {
      errors.push(`Consultation [${cns.id}] references missing sessionId: ${cns.sessionId}`);
    }
  }

  const counts = {
    hospital: 1,
    departments: dataset.departments.length,
    doctors: dataset.doctors.length,
    schedules: dataset.schedules.length,
    sessions: dataset.sessions.length,
    patients: dataset.patients.length,
    appointments: dataset.appointments.length,
    consultations: dataset.consultations.length,
  };

  const totalEntities =
    counts.hospital +
    counts.departments +
    counts.doctors +
    counts.schedules +
    counts.sessions +
    counts.patients +
    counts.appointments +
    counts.consultations;

  return {
    valid: errors.length === 0,
    totalEntities,
    counts,
    errors,
  };
}
