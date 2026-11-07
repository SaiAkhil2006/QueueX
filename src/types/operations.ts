import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";

export const operationalEventTypeSchema = z.enum([
  "doctor_paused",
  "doctor_resumed",
  "doctor_unavailable",
  "emergency_patient_added",
  "consultation_started",
  "consultation_completed",
  "patient_skipped",
  "patient_cancelled",
  "queue_delay_detected",
  "room_reassigned",
]);

export type OperationalEventType = z.infer<typeof operationalEventTypeSchema>;

export const eventSeveritySchema = z.enum(["info", "warning", "critical"]);
export type EventSeverity = z.infer<typeof eventSeveritySchema>;

export const operationalEventSchema = z.object({
  id: z.string().min(1, "Event ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  departmentId: z.string().optional(),
  doctorId: z.string().optional(),
  sessionId: z.string().optional(),
  queueEntryId: z.string().optional(),
  eventType: operationalEventTypeSchema,
  severity: eventSeveritySchema.default("info"),
  timestamp: timestampSchema,
  actorId: z.string().optional(),
  actorRole: z.enum(["doctor", "nurse", "admin", "system"]).default("system"),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type OperationalEvent = z.infer<typeof operationalEventSchema>;
