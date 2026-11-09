import type {
  ScheduleWithDoctor,
  ScheduleFormValues,
  AvailabilityResult,
  ScheduleApiResponse,
  ScheduleListApiResponse,
  AvailabilityApiResponse,
} from "../types";

const DEFAULT_HOSPITAL_ID = "hosp-vzg-001";

/**
 * Fetches schedules for doctors in the hospital with optional filtering.
 */
export async function fetchSchedules(
  hospitalId: string = DEFAULT_HOSPITAL_ID,
  filters?: { doctorId?: string; departmentId?: string }
): Promise<ScheduleWithDoctor[]> {
  const params = new URLSearchParams();
  if (filters?.doctorId) params.set("doctorId", filters.doctorId);
  if (filters?.departmentId) params.set("departmentId", filters.departmentId);

  const qs = params.toString();
  const url = `/api/hospitals/${hospitalId}/schedules${qs ? `?${qs}` : ""}`;

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
      errorData.error || `Failed to fetch schedules (${res.status})`
    );
  }

  const json = (await res.json()) as ScheduleListApiResponse;
  return json.data || [];
}

/**
 * Fetches a single doctor's schedule.
 */
export async function fetchScheduleByDoctor(
  hospitalId: string,
  doctorId: string
): Promise<ScheduleWithDoctor | null> {
  const schedules = await fetchSchedules(hospitalId, { doctorId });
  return schedules[0] || null;
}

/**
 * Creates or updates a doctor's operating schedule.
 */
export async function saveDoctorSchedule(
  hospitalId: string,
  doctorId: string,
  formValues: ScheduleFormValues
): Promise<ScheduleWithDoctor> {
  const payload = {
    doctorId,
    workingDays: formValues.workingDays,
    startTime: formValues.startTime,
    endTime: formValues.endTime,
    maxPatientsPerSession: Number(formValues.maxPatientsPerSession),
    breakPeriods: formValues.breakPeriods,
    isActive: formValues.isActive,
  };

  const res = await fetch(`/api/hospitals/${hospitalId}/schedules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      errorData.error || `Failed to save schedule (${res.status})`
    );
  }

  const json = (await res.json()) as ScheduleApiResponse;
  if (!json.data) {
    throw new Error("Saved schedule not returned by server");
  }

  return json.data;
}

/**
 * Queries real-time / deterministic availability for a doctor at a given date and time.
 */
export async function queryDoctorAvailability(
  hospitalId: string,
  doctorId: string,
  date: string,
  time?: string
): Promise<AvailabilityResult> {
  const params = new URLSearchParams({ doctorId, date });
  if (time) params.set("time", time);

  const res = await fetch(
    `/api/hospitals/${hospitalId}/schedules/availability?${params.toString()}`,
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
      errorData.error || `Failed to check doctor availability (${res.status})`
    );
  }

  const json = (await res.json()) as AvailabilityApiResponse;
  if (!json.data) {
    throw new Error("Availability data not returned by server");
  }

  return json.data;
}
