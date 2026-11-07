import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";

export const recommendationTypeSchema = z.enum([
  "rebalance_queue",
  "call_next_doctor",
  "extend_opd_hours",
  "pause_walkins",
  "dispatch_triage_alert",
]);

export type RecommendationType = z.infer<typeof recommendationTypeSchema>;

export const recommendationPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export type RecommendationPriority = z.infer<typeof recommendationPrioritySchema>;

export const recommendationStatusSchema = z.enum(["pending", "applied", "dismissed"]);
export type RecommendationStatus = z.infer<typeof recommendationStatusSchema>;

export const recommendationSchema = z.object({
  id: z.string().min(1, "Recommendation ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  sessionId: z.string().optional(),
  type: recommendationTypeSchema,
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: recommendationPrioritySchema.default("medium"),
  status: recommendationStatusSchema.default("pending"),
  impactEstimate: z.string().optional(),
  actionPayload: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  appliedAt: timestampSchema.optional(),
  appliedBy: z.string().optional(),
});

export type Recommendation = z.infer<typeof recommendationSchema>;
