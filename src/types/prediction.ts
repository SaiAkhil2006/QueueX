import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";

export const predictionTypeSchema = z.enum([
  "estimated_wait_time",
  "session_completion_time",
  "queue_length_forecast",
  "bottleneck_risk",
]);

export type PredictionType = z.infer<typeof predictionTypeSchema>;

export const predictionFactorSchema = z.object({
  factor: z.string().min(1),
  impactMinutes: z.number(),
  description: z.string().optional(),
});

export type PredictionFactor = z.infer<typeof predictionFactorSchema>;

export const predictionSchema = z.object({
  id: z.string().min(1, "Prediction ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  doctorId: z.string().optional(),
  sessionId: z.string().optional(),
  queueEntryId: z.string().optional(),
  predictionType: predictionTypeSchema,
  targetValue: z.number(),
  confidenceScore: z.number().min(0).max(1).default(0.8),
  modelVersion: z.string().default("v1.0-heuristic"),
  contributingFactors: z.array(predictionFactorSchema).default([]),
  generatedAt: timestampSchema,
  validUntil: timestampSchema,
});

export type Prediction = z.infer<typeof predictionSchema>;
