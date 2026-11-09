import type { Hospital, HospitalStatus } from "@/types/hospital";
import type { Serialized, ApiResponse } from "@/types/common";

export type SerializedHospital = Serialized<Hospital>;

export interface HospitalFormValues {
  name: string;
  code: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  status: HospitalStatus;
  timezone: string;
  opdMorningStartTime: string;
  opdMorningEndTime: string;
  opdEveningStartTime: string;
  opdEveningEndTime: string;
  emergencyWaitThresholdMinutes: number;
  maxActiveQueuesPerDoctor: number;
  autoCallNextEnabled: boolean;
  operatingDays: number[];
}

export type HospitalApiResponse = ApiResponse<SerializedHospital>;
