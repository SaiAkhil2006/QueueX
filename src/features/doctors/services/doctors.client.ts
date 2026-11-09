import type {
  SerializedDoctor,
  DoctorProfile,
  DoctorFormValues,
  DoctorFilterOptions,
  DoctorApiResponse,
  DoctorProfileApiResponse,
  DoctorListApiResponse,
} from "../types";
import type { DoctorStatus, DoctorAvailability } from "@/types/doctor";

const DEFAULT_HOSPITAL_ID = "hosp-vzg-001";

/**
 * Fetches doctors for a hospital with optional filters.
 */
export async function fetchDoctors(
  hospitalId: string = DEFAULT_HOSPITAL_ID,
  filters?: DoctorFilterOptions
): Promise<SerializedDoctor[]> {
  const params = new URLSearchParams();
  if (filters?.departmentId) params.set("departmentId", filters.departmentId);
  if (filters?.availability) params.set("availability", filters.availability);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);

  const queryString = params.toString();
  const url = `/api/hospitals/${hospitalId}/doctors${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      errorData.error || `Failed to fetch doctors (${res.status})`
    );
  }

  const json = (await res.json()) as DoctorListApiResponse;
  return json.data || [];
}

/**
 * Fetches a full doctor profile by ID.
 */
export async function fetchDoctorProfile(
  hospitalId: string,
  doctorId: string
): Promise<DoctorProfile> {
  const res = await fetch(
    `/api/hospitals/${hospitalId}/doctors/${doctorId}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      errorData.error || `Failed to fetch doctor profile (${res.status})`
    );
  }

  const json = (await res.json()) as DoctorProfileApiResponse;
  if (!json.data) {
    throw new Error("Doctor profile not returned by server");
  }

  return json.data;
}

/**
 * Registers a new doctor under a department.
 */
export async function createDoctor(
  hospitalId: string,
  formValues: DoctorFormValues
): Promise<SerializedDoctor> {
  const payload = {
    name: formValues.name.trim(),
    departmentId: formValues.departmentId,
    qualification: formValues.qualification.trim(),
    specialization: formValues.specialization.trim(),
    roomNumber: formValues.roomNumber.trim(),
    consultationDurationEstimate: Number(
      formValues.consultationDurationEstimate
    ),
    phone: formValues.phone?.trim() || undefined,
    email: formValues.email?.trim() || undefined,
    status: formValues.status,
    availability: formValues.availability,
  };

  const res = await fetch(`/api/hospitals/${hospitalId}/doctors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      errorData.error || `Failed to create doctor (${res.status})`
    );
  }

  const json = (await res.json()) as DoctorApiResponse;
  if (!json.data) {
    throw new Error("Created doctor not returned by server");
  }

  return json.data;
}

/**
 * Updates an existing doctor profile or clinical assignment.
 */
export async function updateDoctor(
  hospitalId: string,
  doctorId: string,
  formValues: Partial<DoctorFormValues>
): Promise<SerializedDoctor> {
  const payload: Record<string, unknown> = {};

  if (formValues.name !== undefined) payload.name = formValues.name.trim();
  if (formValues.departmentId !== undefined)
    payload.departmentId = formValues.departmentId;
  if (formValues.qualification !== undefined)
    payload.qualification = formValues.qualification.trim();
  if (formValues.specialization !== undefined)
    payload.specialization = formValues.specialization.trim();
  if (formValues.roomNumber !== undefined)
    payload.roomNumber = formValues.roomNumber.trim();
  if (formValues.consultationDurationEstimate !== undefined)
    payload.consultationDurationEstimate = Number(
      formValues.consultationDurationEstimate
    );
  if (formValues.phone !== undefined)
    payload.phone = formValues.phone.trim() || undefined;
  if (formValues.email !== undefined)
    payload.email = formValues.email.trim() || undefined;
  if (formValues.status !== undefined) payload.status = formValues.status;
  if (formValues.availability !== undefined)
    payload.availability = formValues.availability;

  const res = await fetch(
    `/api/hospitals/${hospitalId}/doctors/${doctorId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      errorData.error || `Failed to update doctor (${res.status})`
    );
  }

  const json = (await res.json()) as DoctorApiResponse;
  if (!json.data) {
    throw new Error("Updated doctor not returned by server");
  }

  return json.data;
}

/**
 * Convenience method to quickly change a doctor's availability status.
 */
export async function setDoctorAvailability(
  hospitalId: string,
  doctorId: string,
  availability: DoctorAvailability
): Promise<SerializedDoctor> {
  return updateDoctor(hospitalId, doctorId, { availability });
}

/**
 * Convenience method to quickly change a doctor's duty status.
 */
export async function setDoctorStatus(
  hospitalId: string,
  doctorId: string,
  status: DoctorStatus
): Promise<SerializedDoctor> {
  return updateDoctor(hospitalId, doctorId, { status });
}
