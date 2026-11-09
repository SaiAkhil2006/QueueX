import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";
import { patientGenderSchema } from "./patient.schema";
import {
  QUEUE_ENTRY_STATUSES,
  QUEUE_PRIORITIES,
  QUEUE_SOURCES,
} from "@/constants";

export const queueEntryStatusSchema = z.enum(QUEUE_ENTRY_STATUSES);
export const queuePrioritySchema = z.enum(QUEUE_PRIORITIES);
export const queueSourceSchema = z.enum(QUEUE_SOURCES);

export const queueEntrySchema = z.object({
  id: z.string().min(1, "Queue Entry ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  departmentName: z.string().min(1, "Department name is required"),
  doctorId: z.string().min(1, "Doctor ID is required"),
  doctorName: z.string().min(1, "Doctor name is required"),
  sessionId: z.string().min(1, "Session ID is required"),
  patientId: z.string().min(1, "Patient ID is required"),
  patientName: z.string().min(1, "Patient name is required"),
  patientAge: z.number().int().nonnegative(),
  patientGender: patientGenderSchema,
  appointmentId: z.string().optional().nullable(),
  tokenNumber: z.number().int().positive("Token number must be a positive integer"),
  tokenDisplay: z.string().min(1, "Token display string is required"),
  source: queueSourceSchema.default("walk_in"),
  priority: queuePrioritySchema.default("normal"),
  status: queueEntryStatusSchema.default("waiting"),
  arrivalTime: timestampSchema,
  calledAt: timestampSchema.optional().nullable(),
  consultationStartedAt: timestampSchema.optional().nullable(),
  consultationCompletedAt: timestampSchema.optional().nullable(),
  estimatedWaitMinutes: z.number().int().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const createQueueEntrySchema = queueEntrySchema
  .omit({
    id: true,
    calledAt: true,
    consultationStartedAt: true,
    consultationCompletedAt: true,
    createdAt: true,
    updatedAt: true,
    arrivalTime: true,
    tokenNumber: true,
    tokenDisplay: true,
  })
  .extend({
    id: z.string().optional(),
    hospitalId: z.string().optional(),
    departmentName: z.string().optional(),
    doctorName: z.string().optional(),
    patientName: z.string().optional(),
    patientAge: z.number().int().optional(),
    patientGender: patientGenderSchema.optional(),
    tokenNumber: z.number().int().positive().optional(),
    tokenDisplay: z.string().optional(),
    arrivalTime: timestampSchema.optional(),
    status: queueEntryStatusSchema.default("waiting"),
  });

export const updateQueueEntryStatusSchema = z.object({
  status: queueEntryStatusSchema,
  calledAt: timestampSchema.optional(),
  consultationStartedAt: timestampSchema.optional(),
  consultationCompletedAt: timestampSchema.optional(),
  notes: z.string().optional(),
});

/**
 * Aggregated live queue state snapshot.
 */
export const queueStateSchema = z.object({
  sessionId: z.string(),
  doctorId: z.string(),
  doctorName: z.string(),
  departmentName: z.string(),
  roomNumber: z.string(),
  currentRunningToken: z.number().int().nullable().optional(),
  totalCount: z.number().int().nonnegative(),
  waitingCount: z.number().int().nonnegative(),
  inConsultationCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  avgWaitMinutes: z.number().nonnegative(),
  estimatedCompletionTime: timestampSchema.optional(),
  lastUpdated: timestampSchema,
});
