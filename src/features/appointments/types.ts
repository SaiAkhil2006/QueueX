import type { Appointment, CreateAppointmentInput, UpdateAppointmentInput, AppointmentStatus, AppointmentType } from "@/types/appointment";

export type { Appointment, CreateAppointmentInput, UpdateAppointmentInput, AppointmentStatus, AppointmentType };

export interface AvailableSlot {
  time: string;
  available: boolean;
  reason?: string;
  doctorId: string;
  date: string;
}

export interface AppointmentFilters {
  date?: string;
  doctorId?: string;
  departmentId?: string;
  patientId?: string;
  status?: AppointmentStatus | "all";
  type?: AppointmentType | "all";
}

export interface CreateWalkInInput {
  patientId: string;
  doctorId: string;
  notes?: string;
}
