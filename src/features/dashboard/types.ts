import type { OPDSessionStatus } from "@/types/scheduling";
import type { DoctorAvailability } from "@/types/doctor";
import type { SerializedOperationalEvent } from "@/features/sessions/types";

export interface HospitalOverviewSummary {
  hospitalId: string;
  hospitalName: string;
  operatingStatus: string;
  activeDepartmentsCount: number;
  totalDepartmentsCount: number;
  activeDoctorsCount: number;
  totalDoctorsCount: number;
  currentDateFormatted: string;
}

export interface SessionsOverviewSummary {
  totalToday: number;
  active: number;
  paused: number;
  scheduled: number;
  completed: number;
  cancelled: number;
}

export interface DepartmentDashboardItem {
  id: string;
  name: string;
  code: string;
  assignedDoctorsCount: number;
  activeDoctorsCount: number;
  scheduledSessionsCount: number;
  activeSessionsCount: number;
  operationalStatus: "active" | "inactive" | "busy" | "normal";
}

export interface DoctorAvailabilityItem {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  roomNumber: string;
  availability: DoctorAvailability;
  currentSessionStatus: OPDSessionStatus | null;
  nextSession: {
    date: string;
    startTime: string;
    endTime: string;
  } | null;
}

export interface UpcomingSessionItem {
  id: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  roomNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  status: OPDSessionStatus;
}

export interface DashboardData {
  hospital: HospitalOverviewSummary;
  sessionsSummary: SessionsOverviewSummary;
  departments: DepartmentDashboardItem[];
  doctors: DoctorAvailabilityItem[];
  upcomingSessions: UpcomingSessionItem[];
  recentEvents: SerializedOperationalEvent[];
  lastUpdated: string;
}

export interface DashboardApiResponse {
  success: boolean;
  data?: DashboardData;
  error?: string;
}
