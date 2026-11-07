import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";

export const consultationOutcomeSchema = z.enum([
  "prescribed",
  "referred",
  "admitted",
  "tests_ordered",
  "follow_up_needed",
  "routine_clear",
]);

export type ConsultationOutcome = z.infer<typeof consultationOutcomeSchema>;

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
  startedAt: timestampSchema,
  completedAt: timestampSchema,
  durationSeconds: z.number().int().nonnegative("Duration must be non-negative seconds"),
  outcome: consultationOutcomeSchema.default("routine_clear"),
  delayReason: z.string().optional(),
  notes: z.string().optional(),
  createdAt: timestampSchema,
});

export type Consultation = z.infer<typeof consultationSchema>;
