import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";
import {
  CONSULTATION_STATUSES,
  CONSULTATION_OUTCOMES,
} from "@/constants";

export const consultationStatusSchema = z.enum(CONSULTATION_STATUSES);
export const consultationOutcomeSchema = z.enum(CONSULTATION_OUTCOMES);

export const consultationSchema = z.object({
  id: z.string().min(1, "Consultation ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  departmentName: z.string().min(1, "Department name is required"),
  doctorId: z.string().min(1, "Doctor ID is required"),
  doctorName: z.string().min(1, "Doctor name is required"),
  sessionId: z.string().min(1, "Session ID is required"),
  queueEntryId: z.string().min(1, "Queue Entry ID is required"),
  patientId: z.string().min(1, "Patient ID is required"),
  patientName: z.string().min(1, "Patient name is required"),
  tokenNumber: z.number().int().positive(),
  status: consultationStatusSchema.default("completed"),
  startedAt: timestampSchema,
  completedAt: timestampSchema,
  durationSeconds: z
    .number()
    .int()
    .nonnegative("Duration must be non-negative seconds"),
  outcome: consultationOutcomeSchema.default("routine_clear"),
  delayReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: timestampSchema,
});

export const createConsultationSchema = consultationSchema
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    id: z.string().optional(),
  });
