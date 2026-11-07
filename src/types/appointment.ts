import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";

export const appointmentStatusSchema = z.enum([
  "booked",
  "checked_in",
  "completed",
  "cancelled",
  "no_show",
]);

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const appointmentTypeSchema = z.enum(["regular", "follow_up", "referral"]);
export type AppointmentType = z.infer<typeof appointmentTypeSchema>;

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
  tokenNumber: z.number().int().positive().optional(),
  queueEntryId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Appointment = z.infer<typeof appointmentSchema>;
