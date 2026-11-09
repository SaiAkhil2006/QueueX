import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";
import {
  PREDICTION_TYPES,
  PREDICTION_CONFIDENCES,
  RECOMMENDATION_TYPES,
  RECOMMENDATION_PRIORITIES,
  RECOMMENDATION_STATUSES,
} from "@/constants";

export const predictionTypeSchema = z.enum(PREDICTION_TYPES);
export const predictionConfidenceSchema = z.enum(PREDICTION_CONFIDENCES);

export const predictionFactorSchema = z.object({
  factor: z.string().min(1, "Factor name is required"),
  impactMinutes: z.number(),
  description: z.string().optional().nullable(),
});

export const predictionSchema = z.object({
  id: z.string().min(1, "Prediction ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  doctorId: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  queueEntryId: z.string().optional().nullable(),
  tokenDisplay: z.string().optional().nullable(),
  patientName: z.string().optional().nullable(),
  patientPosition: z.number().int().optional().nullable(),
  predictionType: predictionTypeSchema,
  targetValue: z.number(), // Wait time in minutes
  predictedCallTime: timestampSchema.optional().nullable(),
  isDelayed: z.boolean().default(false),
  delayMinutes: z.number().default(0),
  notifyApproach: z.boolean().default(false),
  confidenceScore: z.number().min(0).max(1).default(0.8),
  confidenceLevel: predictionConfidenceSchema.default("medium"),
  modelVersion: z.string().default("v1.0-heuristic"),
  contributingFactors: z.array(predictionFactorSchema).default([]),
  actualWaitMinutes: z.number().optional().nullable(),
  absoluteErrorMinutes: z.number().optional().nullable(),
  generatedAt: timestampSchema,
  validUntil: timestampSchema,
});

export const createPredictionSchema = predictionSchema
  .omit({
    id: true,
  })
  .extend({
    id: z.string().optional(),
  });

export const recommendationTypeSchema = z.enum(RECOMMENDATION_TYPES);
export const recommendationPrioritySchema = z.enum(RECOMMENDATION_PRIORITIES);
export const recommendationStatusSchema = z.enum(RECOMMENDATION_STATUSES);

export const recommendationSchema = z.object({
  id: z.string().min(1, "Recommendation ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  sessionId: z.string().optional().nullable(),
  type: recommendationTypeSchema,
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: recommendationPrioritySchema.default("medium"),
  status: recommendationStatusSchema.default("pending"),
  impactEstimate: z.string().optional().nullable(),
  actionPayload: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  appliedAt: timestampSchema.optional().nullable(),
  appliedBy: z.string().optional().nullable(),
});

export const createRecommendationSchema = recommendationSchema
  .omit({
    id: true,
    appliedAt: true,
    appliedBy: true,
  })
  .extend({
    id: z.string().optional(),
  });

export const updateRecommendationStatusSchema = z.object({
  status: recommendationStatusSchema,
  appliedAt: timestampSchema.optional(),
  appliedBy: z.string().optional(),
});
