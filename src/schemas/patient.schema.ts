import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";
import { PATIENT_STATUSES, PATIENT_GENDERS } from "@/constants";

export const patientStatusSchema = z.enum(PATIENT_STATUSES);
export const patientGenderSchema = z.enum(PATIENT_GENDERS);

export const emergencyContactSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  phone: z.string().min(7, "Valid contact phone is required"),
  relation: z.string().min(1, "Relation is required"),
});

export const patientSchema = z.object({
  id: z.string().min(1, "Patient ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  uhid: z.string().min(3, "UHID is required"),
  name: z.string().min(1, "Patient name is required"),
  age: z.number().int().nonnegative("Age must be non-negative"),
  gender: patientGenderSchema,
  phone: z.string().min(7, "Valid phone number is required"),
  email: z.string().email().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  status: patientStatusSchema.default("active"),
  emergencyContact: emergencyContactSchema.optional().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const createPatientSchema = patientSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string().optional(),
  });

export const updatePatientSchema = createPatientSchema
  .omit({
    hospitalId: true,
    uhid: true,
  })
  .partial();
