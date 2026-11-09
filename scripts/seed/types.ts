import type { Hospital } from "@/types/hospital";
import type { Department } from "@/types/department";
import type { Doctor } from "@/types/doctor";
import type { DoctorSchedule, OPDSession } from "@/types/scheduling";
import type { Patient } from "@/types/patient";
import type { Appointment } from "@/types/appointment";
import type { Consultation } from "@/types/consultation";

export interface SeedDataset {
  hospital: Hospital;
  departments: Department[];
  doctors: Doctor[];
  schedules: DoctorSchedule[];
  sessions: OPDSession[];
  patients: Patient[];
  appointments: Appointment[];
  consultations: Consultation[];
}

export interface SeedOptions {
  /**
   * Reference date for relative date generation (defaults to new Date()).
   */
  baseDate?: Date;
  /**
   * Target timezone (defaults to Asia/Kolkata).
   */
  timezone?: string;
}

export interface SeedValidationReport {
  valid: boolean;
  totalEntities: number;
  counts: {
    hospital: number;
    departments: number;
    doctors: number;
    schedules: number;
    sessions: number;
    patients: number;
    appointments: number;
    consultations: number;
  };
  errors: string[];
}

export interface CliOptions {
  clear?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}
