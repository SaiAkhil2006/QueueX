import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";

export const departmentSchema = z.object({
  id: z.string().min(1, "Department ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  name: z.string().min(1, "Department name is required"),
  code: z.string().min(2, "Department code must be at least 2 characters").toUpperCase(),
  description: z.string().optional(),
  floor: z.string().optional(),
  buildingWing: z.string().optional(),
  avgConsultationDurationMinutes: z.number().int().positive().default(15),
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Department = z.infer<typeof departmentSchema>;
