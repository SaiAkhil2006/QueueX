import type { z } from "zod";
import {
  patientSchema,
  createPatientSchema,
  updatePatientSchema,
  patientStatusSchema,
  patientGenderSchema,
  emergencyContactSchema,
} from "@/schemas/patient.schema";

export type Patient = z.infer<typeof patientSchema>;
export type CreatePatientInput = z.input<typeof createPatientSchema>;
export type UpdatePatientInput = z.input<typeof updatePatientSchema>;
export type PatientStatus = z.infer<typeof patientStatusSchema>;
export type PatientGender = z.infer<typeof patientGenderSchema>;
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;

export {
  patientSchema,
  createPatientSchema,
  updatePatientSchema,
  patientStatusSchema,
  patientGenderSchema,
  emergencyContactSchema,
};
