import type { Doctor, DoctorStatus, DoctorAvailability } from "@/types/doctor";
import type { DoctorSchedule, OPDSession } from "@/types/scheduling";
import type { Serialized, ApiResponse } from "@/types/common";

export type SerializedDoctor = Serialized<Doctor>;

export interface DoctorProfile extends SerializedDoctor {
  schedule?: Serialized<DoctorSchedule> | null;
  upcomingSessions?: Serialized<OPDSession>[];
  stats?: {
    totalConsultations: number;
    completedToday: number;
  };
}

export interface DoctorFormValues {
  name: string;
  departmentId: string;
  qualification: string;
  specialization: string;
  roomNumber: string;
  consultationDurationEstimate: number;
  phone?: string;
  email?: string;
  status: DoctorStatus;
  availability: DoctorAvailability;
}

export interface DoctorFilterOptions {
  departmentId?: string;
  availability?: DoctorAvailability;
  status?: DoctorStatus;
  search?: string;
}

export type DoctorApiResponse = ApiResponse<SerializedDoctor>;
export type DoctorProfileApiResponse = ApiResponse<DoctorProfile>;
export type DoctorListApiResponse = ApiResponse<SerializedDoctor[]>;
