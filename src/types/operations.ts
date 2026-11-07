import type { z } from "zod";
import {
  operationalEventSchema,
  createOperationalEventSchema,
  operationalEventTypeSchema,
  eventSeveritySchema,
  actorRoleSchema,
} from "@/schemas/operations.schema";

export type OperationalEvent = z.infer<typeof operationalEventSchema>;
export type CreateOperationalEventInput = z.infer<typeof createOperationalEventSchema>;
export type OperationalEventType = z.infer<typeof operationalEventTypeSchema>;
export type EventSeverity = z.infer<typeof eventSeveritySchema>;
export type ActorRole = z.infer<typeof actorRoleSchema>;

export {
  operationalEventSchema,
  createOperationalEventSchema,
  operationalEventTypeSchema,
  eventSeveritySchema,
  actorRoleSchema,
};
