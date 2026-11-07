import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";
import {
  OPERATIONAL_EVENT_TYPES,
  EVENT_SEVERITIES,
  ACTOR_ROLES,
} from "@/constants";

export const operationalEventTypeSchema = z.enum(OPERATIONAL_EVENT_TYPES);
export const eventSeveritySchema = z.enum(EVENT_SEVERITIES);
export const actorRoleSchema = z.enum(ACTOR_ROLES);

export const operationalEventSchema = z.object({
  id: z.string().min(1, "Event ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  departmentId: z.string().optional().nullable(),
  doctorId: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  queueEntryId: z.string().optional().nullable(),
  eventType: operationalEventTypeSchema,
  severity: eventSeveritySchema.default("info"),
  timestamp: timestampSchema,
  actorId: z.string().optional().nullable(),
  actorRole: actorRoleSchema.default("system"),
  description: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const createOperationalEventSchema = operationalEventSchema
  .omit({
    id: true,
  })
  .extend({
    id: z.string().optional(),
  });
