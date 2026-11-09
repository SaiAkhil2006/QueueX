import type {
  Appointment,
  CreateAppointmentInput,
  AvailableSlot,
  CreateWalkInInput,
  AppointmentFilters,
} from "../types";

export async function fetchAppointments(
  hospitalId: string,
  filters?: AppointmentFilters
): Promise<Appointment[]> {
  const searchParams = new URLSearchParams();
  if (filters?.date) searchParams.set("date", filters.date);
  if (filters?.doctorId) searchParams.set("doctorId", filters.doctorId);
  if (filters?.departmentId) searchParams.set("departmentId", filters.departmentId);
  if (filters?.patientId) searchParams.set("patientId", filters.patientId);
  if (filters?.status && filters.status !== "all") searchParams.set("status", filters.status);

  const res = await fetch(`/api/hospitals/${hospitalId}/appointments?${searchParams.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch appointments");
  }

  const data = await res.json();
  return data.appointments;
}

export async function fetchAvailableSlots(
  hospitalId: string,
  params: { doctorId: string; date: string }
): Promise<AvailableSlot[]> {
  const searchParams = new URLSearchParams({
    doctorId: params.doctorId,
    date: params.date,
  });

  const res = await fetch(`/api/hospitals/${hospitalId}/appointments/slots?${searchParams.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch available slots");
  }

  const data = await res.json();
  return data.slots;
}

export async function createAppointmentClient(
  hospitalId: string,
  input: CreateAppointmentInput
): Promise<Appointment> {
  const res = await fetch(`/api/hospitals/${hospitalId}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to book appointment");
  }

  const data = await res.json();
  return data.appointment;
}

export async function createWalkInClient(
  hospitalId: string,
  input: CreateWalkInInput
): Promise<Appointment> {
  const res = await fetch(`/api/hospitals/${hospitalId}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, appointmentType: "walk_in", isWalkIn: true }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to register walk-in patient");
  }

  const data = await res.json();
  return data.appointment;
}

export async function cancelAppointmentClient(
  hospitalId: string,
  appointmentId: string,
  reason?: string
): Promise<Appointment> {
  const res = await fetch(`/api/hospitals/${hospitalId}/appointments/${appointmentId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to cancel appointment");
  }

  const data = await res.json();
  return data.appointment;
}

export async function rescheduleAppointmentClient(
  hospitalId: string,
  appointmentId: string,
  newDate: string,
  newTime: string
): Promise<Appointment> {
  const res = await fetch(`/api/hospitals/${hospitalId}/appointments/${appointmentId}/reschedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newDate, newTime }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to reschedule appointment");
  }

  const data = await res.json();
  return data.appointment;
}

export async function checkInAppointmentClient(
  hospitalId: string,
  appointmentId: string
): Promise<Appointment> {
  const res = await fetch(`/api/hospitals/${hospitalId}/appointments/${appointmentId}/check-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to check in appointment");
  }

  const data = await res.json();
  return data.appointment;
}
