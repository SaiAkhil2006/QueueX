import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { nowTimestamp } from "@/lib/firebase/server-timestamps";
import { toDate } from "@/lib/firebase/timestamps";
import { createPatientSchema, updatePatientSchema } from "@/schemas/patient.schema";
import type { Patient, CreatePatientInput, UpdatePatientInput } from "../types";
import type { PatientWithHistory } from "../types";
import type { Appointment } from "@/types/appointment";
import type { Consultation } from "@/types/consultation";

/**
 * Generate a unique UHID in the format QX-YYYY-XXXX.
 */
export async function generateUniqueUHID(hospitalId: string): Promise<string> {
  const db = getAdminFirestore();
  const currentYear = new Date().getFullYear();
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const candidateUHID = `QX-${currentYear}-${randomSeq}`;

    const existingSnap = await db
      .collection(paths.patients(hospitalId))
      .where("uhid", "==", candidateUHID)
      .limit(1)
      .get();

    if (existingSnap.empty) {
      return candidateUHID;
    }
  }

  // Fallback with millisecond component
  return `QX-${currentYear}-${Date.now().toString().slice(-4)}`;
}

/**
 * Retrieve patients with optional search and filtering.
 */
export async function getPatients(
  hospitalId: string,
  filters?: {
    search?: string;
    status?: string;
    gender?: string;
    limit?: number;
  }
): Promise<Patient[]> {
  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection(paths.patients(hospitalId)).limit(filters?.limit || 100);

  if (filters?.status && filters.status !== "all") {
    query = query.where("status", "==", filters.status);
  }

  if (filters?.gender && filters.gender !== "all") {
    query = query.where("gender", "==", filters.gender);
  }

  const snapshot = await query.get();
  let patients: Patient[] = snapshot.docs.map((doc) => doc.data() as Patient);

  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim().toLowerCase();
    patients = patients.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(term);
      const uhidMatch = p.uhid?.toLowerCase().includes(term);
      const phoneMatch = p.phone?.toLowerCase().includes(term);
      return nameMatch || uhidMatch || phoneMatch;
    });
  }

  // Sort by updatedAt descending
  return patients.sort((a, b) => {
    const aTime = toDate(a.updatedAt)?.getTime() || 0;
    const bTime = toDate(b.updatedAt)?.getTime() || 0;
    return bTime - aTime;
  });
}

/**
 * Retrieve a single patient by ID along with their appointment and consultation history.
 */
export async function getPatientById(
  hospitalId: string,
  patientId: string
): Promise<PatientWithHistory | null> {
  const db = getAdminFirestore();
  const docRef = db.doc(paths.patient(hospitalId, patientId));
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const patient = snapshot.data() as Patient;

  // Fetch appointments for this patient
  const appointmentsSnap = await db
    .collection(paths.appointments(hospitalId))
    .where("patientId", "==", patientId)
    .limit(50)
    .get();

  const appointments = appointmentsSnap.docs.map((d) => d.data() as Appointment);
  appointments.sort((a, b) => (b.scheduledDate + b.scheduledTime).localeCompare(a.scheduledDate + a.scheduledTime));

  // Fetch consultations for this patient
  const consultationsSnap = await db
    .collection(paths.consultations(hospitalId))
    .where("patientId", "==", patientId)
    .limit(50)
    .get();

  const consultations = consultationsSnap.docs.map((d) => d.data() as Consultation);

  const lastVisit = appointments[0]?.scheduledDate || null;

  return {
    ...patient,
    appointments,
    consultations,
    totalVisits: consultations.length + appointments.filter((a) => a.status === "completed").length,
    lastVisitDate: lastVisit,
  };
}

/**
 * Register a new patient in the hospital.
 */
export async function createPatient(
  hospitalId: string,
  input: CreatePatientInput
): Promise<Patient> {
  const db = getAdminFirestore();
  let uhid = input.uhid;
  if (!uhid || uhid.trim() === "") {
    uhid = await generateUniqueUHID(hospitalId);
  }

  // Verify UHID uniqueness
  const existingUHID = await db
    .collection(paths.patients(hospitalId))
    .where("uhid", "==", uhid)
    .limit(1)
    .get();

  if (!existingUHID.empty) {
    throw new Error(`Patient with UHID '${uhid}' already exists.`);
  }

  const patientId = input.id || `pat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const validated = createPatientSchema.parse({
    ...input,
    id: patientId,
    hospitalId,
    uhid,
  });

  const now = nowTimestamp();
  const docRef = db.doc(paths.patient(hospitalId, patientId));

  const patientRecord: Record<string, unknown> = {
    ...validated,
    id: patientId,
    hospitalId,
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(patientRecord);
  const createdSnap = await docRef.get();
  return createdSnap.data() as Patient;
}

/**
 * Update patient profile details.
 */
export async function updatePatient(
  hospitalId: string,
  patientId: string,
  input: UpdatePatientInput
): Promise<Patient> {
  const db = getAdminFirestore();
  const docRef = db.doc(paths.patient(hospitalId, patientId));
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    throw new Error(`Patient with ID '${patientId}' not found.`);
  }

  const validated = updatePatientSchema.parse(input);
  const updatePayload: Record<string, unknown> = {
    ...validated,
    updatedAt: nowTimestamp(),
  };

  await docRef.update(updatePayload);
  const updatedSnap = await docRef.get();
  return updatedSnap.data() as Patient;
}
