import type { z } from "zod";
import {
  doctorSchema,
  createDoctorSchema,
  updateDoctorSchema,
  doctorStatusSchema,
  doctorAvailabilitySchema,
} from "@/schemas/doctor.schema";

export type Doctor = z.infer<typeof doctorSchema>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type DoctorStatus = z.infer<typeof doctorStatusSchema>;
export type DoctorAvailability = z.infer<typeof doctorAvailabilitySchema>;

export {
  doctorSchema,
  createDoctorSchema,
  updateDoctorSchema,
  doctorStatusSchema,
  doctorAvailabilitySchema,
};
