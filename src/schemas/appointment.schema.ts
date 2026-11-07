import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";
import { APPOINTMENT_STATUSES, APPOINTMENT_TYPES } from "@/constants";

export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES);
export const appointmentTypeSchema = z.enum(APPOINTMENT_TYPES);

export const appointmentSchema = z.object({
  id: z.string().min(1, "Appointment ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  patientId: z.string().min(1, "Patient ID is required"),
  patientName: z.string().min(1, "Patient name is required"),
  patientPhone: z.string().min(7, "Valid phone number is required"),
  doctorId: z.string().min(1, "Doctor ID is required"),
  doctorName: z.string().min(1, "Doctor name is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  departmentName: z.string().min(1, "Department name is required"),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM"),
  scheduledAt: timestampSchema,
  appointmentType: appointmentTypeSchema.default("regular"),
  status: appointmentStatusSchema.default("booked"),
  tokenNumber: z.number().int().positive().optional().nullable(),
  queueEntryId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const createAppointmentSchema = appointmentSchema
  .omit({
    id: true,
    status: true,
    tokenNumber: true,
    queueEntryId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string().optional(),
    status: appointmentStatusSchema.default("booked"),
  });

export const updateAppointmentSchema = appointmentSchema
  .omit({
    hospitalId: true,
    patientId: true,
  })
  .partial();
