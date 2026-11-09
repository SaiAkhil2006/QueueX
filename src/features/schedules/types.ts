import type { DoctorSchedule, ScheduleBreak } from "@/types/scheduling";
import type { DoctorAvailability } from "@/types/doctor";
import type { Serialized, ApiResponse } from "@/types/common";

export type SerializedDoctorSchedule = Serialized<DoctorSchedule>;

export interface ScheduleWithDoctor extends SerializedDoctorSchedule {
  doctorName: string;
  doctorQualification: string;
  doctorSpecialization: string;
  roomNumber: string;
  departmentName: string;
  doctorAvailability?: DoctorAvailability;
}

export interface ScheduleFormValues {
  workingDays: number[];
  startTime: string;
  endTime: string;
  maxPatientsPerSession: number;
  breakPeriods: ScheduleBreak[];
  isActive: boolean;
}

export type AvailabilityStatus =
  | "available"
  | "not_working_day"
  | "outside_hours"
  | "on_break"
  | "off_duty"
  | "inactive";

export interface AvailabilityResult {
  isAvailable: boolean;
  status: AvailabilityStatus;
  reason: string;
  targetDate: string;
  targetTime: string;
  dayOfWeek: number;
  dayName: string;
  shiftHours?: {
    startTime: string;
    endTime: string;
  };
  currentBreak?: ScheduleBreak;
  nextAvailableTime?: string;
}

export type ScheduleApiResponse = ApiResponse<ScheduleWithDoctor>;
export type ScheduleListApiResponse = ApiResponse<ScheduleWithDoctor[]>;
export type AvailabilityApiResponse = ApiResponse<AvailabilityResult>;
