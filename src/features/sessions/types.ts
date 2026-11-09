import type { OPDSession, OPDSessionStatus } from "@/types/scheduling";
import type { OperationalEvent } from "@/types/operations";
import type { Serialized } from "@/types/common";

export type SerializedOPDSession = Serialized<OPDSession>;
export type SerializedOperationalEvent = Serialized<OperationalEvent>;

export type SessionTransitionAction =
  | "start"
  | "pause"
  | "resume"
  | "complete"
  | "cancel";

export interface SessionTransitionInput {
  action: SessionTransitionAction;
  actorId?: string;
  actorRole?: "doctor" | "nurse" | "admin" | "system";
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface SessionFilters {
  date?: string;
  doctorId?: string;
  departmentId?: string;
  status?: OPDSessionStatus | "all";
  view?: "all" | "today" | "upcoming" | "past";
}

export interface CreateSessionFormValues {
  departmentId: string;
  doctorId: string;
  roomNumber: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface SessionApiResponse {
  success: boolean;
  data?: SerializedOPDSession;
  error?: string;
  eventId?: string;
}

export interface SessionListApiResponse {
  success: boolean;
  data?: SerializedOPDSession[];
  error?: string;
  count?: number;
}

export interface OperationalEventsApiResponse {
  success: boolean;
  data?: SerializedOperationalEvent[];
  error?: string;
}
