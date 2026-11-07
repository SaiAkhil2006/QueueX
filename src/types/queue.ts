import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";
import { patientGenderSchema } from "./patient";

export const queueEntryStatusSchema = z.enum([
  "waiting",
  "called",
  "in_consultation",
  "completed",
  "skipped",
  "cancelled",
]);

export type QueueEntryStatus = z.infer<typeof queueEntryStatusSchema>;

export const queuePrioritySchema = z.enum(["normal", "priority", "emergency"]);
export type QueuePriority = z.infer<typeof queuePrioritySchema>;

export const queueSourceSchema = z.enum(["appointment", "walk_in", "emergency"]);
export type QueueSource = z.infer<typeof queueSourceSchema>;

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
  appointmentId: z.string().optional(),
  tokenNumber: z.number().int().positive("Token number must be a positive integer"),
  tokenDisplay: z.string().min(1, "Token display string is required"),
  source: queueSourceSchema.default("walk_in"),
  priority: queuePrioritySchema.default("normal"),
  status: queueEntryStatusSchema.default("waiting"),
  arrivalTime: timestampSchema,
  calledAt: timestampSchema.optional(),
  consultationStartedAt: timestampSchema.optional(),
  consultationCompletedAt: timestampSchema.optional(),
  estimatedWaitMinutes: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type QueueEntry = z.infer<typeof queueEntrySchema>;
