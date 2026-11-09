import type { z } from "zod";
import {
  predictionSchema,
  createPredictionSchema,
  predictionTypeSchema,
  predictionConfidenceSchema,
  predictionFactorSchema,
  recommendationSchema,
  createRecommendationSchema,
  updateRecommendationStatusSchema,
  recommendationTypeSchema,
  recommendationPrioritySchema,
  recommendationStatusSchema,
} from "@/schemas/intelligence.schema";

export type Prediction = z.infer<typeof predictionSchema>;
export type WaitingTimePrediction = Prediction; // Domain alias
export type CreatePredictionInput = z.input<typeof createPredictionSchema>;
export type PredictionType = z.infer<typeof predictionTypeSchema>;
export type PredictionConfidence = z.infer<typeof predictionConfidenceSchema>;
export type PredictionFactor = z.infer<typeof predictionFactorSchema>;

export type Recommendation = z.infer<typeof recommendationSchema>;
export type OperationalRecommendation = Recommendation; // Domain alias
export type CreateRecommendationInput = z.input<typeof createRecommendationSchema>;
export type UpdateRecommendationStatusInput = z.infer<typeof updateRecommendationStatusSchema>;
export type RecommendationType = z.infer<typeof recommendationTypeSchema>;
export type RecommendationPriority = z.infer<typeof recommendationPrioritySchema>;
export type RecommendationStatus = z.infer<typeof recommendationStatusSchema>;

export {
  predictionSchema,
  createPredictionSchema,
  predictionTypeSchema,
  predictionConfidenceSchema,
  predictionFactorSchema,
  recommendationSchema,
  createRecommendationSchema,
  updateRecommendationStatusSchema,
  recommendationTypeSchema,
  recommendationPrioritySchema,
  recommendationStatusSchema,
};
