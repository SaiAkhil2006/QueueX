import type { Department, DepartmentStatus } from "@/types/department";
import type { Serialized, ApiResponse } from "@/types/common";

export type SerializedDepartment = Serialized<Department>;

export interface DepartmentWithStats extends SerializedDepartment {
  doctorCount: number;
  activeDoctorCount: number;
}

export interface DepartmentFormValues {
  name: string;
  code: string;
  description?: string;
  floor?: string;
  buildingWing?: string;
  avgConsultationDurationMinutes: number;
  status: DepartmentStatus;
}

export type DepartmentApiResponse = ApiResponse<DepartmentWithStats>;
export type DepartmentListApiResponse = ApiResponse<DepartmentWithStats[]>;
