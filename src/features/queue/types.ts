import type {
  QueueEntry,
  CreateQueueEntryInput,
  UpdateQueueEntryStatusInput,
  QueueEntryStatus,
  QueuePriority,
  QueueSource,
} from "@/types/queue";
import type { OPDSession } from "@/types/scheduling";
import type { ConsultationOutcome } from "@/types/consultation";

export type {
  QueueEntry,
  CreateQueueEntryInput,
  UpdateQueueEntryStatusInput,
  QueueEntryStatus,
  QueuePriority,
  QueueSource,
  ConsultationOutcome,
};

export interface QueueEntryWithPosition extends QueueEntry {
  position: number;
  calculatedWaitMinutes: number;
}

export interface LiveSessionQueueState {
  session: OPDSession | null;
  currentlyInConsultation: QueueEntry | null;
  currentlyCalled: QueueEntry | null;
  waitingQueue: QueueEntryWithPosition[];
  skippedQueue: QueueEntry[];
  recentCompleted: QueueEntry[];
  stats: {
    totalTokens: number;
    waitingCount: number;
    completedCount: number;
    avgWaitMinutes: number;
  };
}

export interface CompleteConsultationPayload {
  outcome: ConsultationOutcome;
  notes?: string;
  delayReason?: string;
}

export interface CreateEmergencyTokenInput {
  sessionId: string;
  patientId: string;
  notes?: string;
}
