import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";
import { DOCTOR_STATUSES, DOCTOR_AVAILABILITY } from "@/constants";

export const doctorStatusSchema = z.enum(DOCTOR_STATUSES);
export const doctorAvailabilitySchema = z.enum(DOCTOR_AVAILABILITY);

export const doctorSchema = z.object({
  id: z.string().min(1, "Doctor ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  departmentName: z.string().min(1, "Department name is required"),
  name: z.string().min(1, "Doctor name is required"),
  qualification: z.string().min(1, "Qualification is required"),
  specialization: z.string().min(1, "Specialization is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  consultationDurationEstimate: z
    .number()
    .int()
    .positive("Consultation duration estimate must be positive")
    .default(15),
  status: doctorStatusSchema.default("active"),
  availability: doctorAvailabilitySchema.default("available"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const createDoctorSchema = doctorSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string().optional(),
  });

export const updateDoctorSchema = createDoctorSchema
  .omit({ hospitalId: true, departmentId: true })
  .partial();
