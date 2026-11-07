import type { z } from "zod";
import {
  appointmentSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentStatusSchema,
  appointmentTypeSchema,
} from "@/schemas/appointment.schema";

export type Appointment = z.infer<typeof appointmentSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type AppointmentType = z.infer<typeof appointmentTypeSchema>;

export {
  appointmentSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentStatusSchema,
  appointmentTypeSchema,
};
