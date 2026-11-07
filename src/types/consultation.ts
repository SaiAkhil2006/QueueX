import type { z } from "zod";
import {
  consultationSchema,
  createConsultationSchema,
  consultationStatusSchema,
  consultationOutcomeSchema,
} from "@/schemas/consultation.schema";

export type Consultation = z.infer<typeof consultationSchema>;
export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type ConsultationStatus = z.infer<typeof consultationStatusSchema>;
export type ConsultationOutcome = z.infer<typeof consultationOutcomeSchema>;

export {
  consultationSchema,
  createConsultationSchema,
  consultationStatusSchema,
  consultationOutcomeSchema,
};
