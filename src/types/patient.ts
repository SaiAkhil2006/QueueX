import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";

export const patientGenderSchema = z.enum(["male", "female", "other"]);
export type PatientGender = z.infer<typeof patientGenderSchema>;

export const patientSchema = z.object({
  id: z.string().min(1, "Patient ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  uhid: z.string().min(3, "UHID is required"),
  name: z.string().min(1, "Patient name is required"),
  age: z.number().int().nonnegative("Age must be non-negative"),
  gender: patientGenderSchema,
  phone: z.string().min(7, "Valid phone number is required"),
  email: z.string().email().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string().min(1),
      phone: z.string().min(7),
      relation: z.string().min(1),
    })
    .optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Patient = z.infer<typeof patientSchema>;
