import type { Patient, CreatePatientInput, UpdatePatientInput, PatientWithHistory } from "../types";

export async function fetchPatients(
  hospitalId: string,
  params?: { search?: string; status?: string; gender?: string }
): Promise<Patient[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.gender) searchParams.set("gender", params.gender);

  const res = await fetch(`/api/hospitals/${hospitalId}/patients?${searchParams.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch patients");
  }

  const data = await res.json();
  return data.patients;
}

export async function fetchPatientById(
  hospitalId: string,
  patientId: string
): Promise<PatientWithHistory> {
  const res = await fetch(`/api/hospitals/${hospitalId}/patients/${patientId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch patient details");
  }

  const data = await res.json();
  return data.patient;
}

export async function createPatientClient(
  hospitalId: string,
  input: CreatePatientInput
): Promise<Patient> {
  const res = await fetch(`/api/hospitals/${hospitalId}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to register patient");
  }

  const data = await res.json();
  return data.patient;
}

export async function updatePatientClient(
  hospitalId: string,
  patientId: string,
  input: UpdatePatientInput
): Promise<Patient> {
  const res = await fetch(`/api/hospitals/${hospitalId}/patients/${patientId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update patient profile");
  }

  const data = await res.json();
  return data.patient;
}
