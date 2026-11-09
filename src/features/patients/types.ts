import type { Patient, CreatePatientInput, UpdatePatientInput, PatientStatus, PatientGender } from "@/types/patient";
import type { Appointment } from "@/types/appointment";
import type { Consultation } from "@/types/consultation";

export type { Patient, CreatePatientInput, UpdatePatientInput, PatientStatus, PatientGender };

export interface PatientWithHistory extends Patient {
  appointments: Appointment[];
  consultations: Consultation[];
  totalVisits: number;
  lastVisitDate?: string | null;
}

export interface PatientFilters {
  search?: string;
  status?: PatientStatus | "all";
  gender?: PatientGender | "all";
  bloodGroup?: string | "all";
}
