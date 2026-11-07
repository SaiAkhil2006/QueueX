import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";

export const doctorSchema = z.object({
  id: z.string().min(1, "Doctor ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  departmentName: z.string().min(1, "Department name is required"),
  name: z.string().min(1, "Doctor name is required"),
  qualification: z.string().min(1, "Qualification is required"),
  specialization: z.string().min(1, "Specialization is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  consultationDurationEstimate: z.number().int().positive().default(15),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Doctor = z.infer<typeof doctorSchema>;

export const breakPeriodSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM"),
  label: z.string().min(1),
});

export type BreakPeriod = z.infer<typeof breakPeriodSchema>;

export const doctorScheduleSchema = z.object({
  id: z.string().min(1, "Schedule ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  doctorId: z.string().min(1, "Doctor ID is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  workingDays: z.array(z.number().int().min(0).max(6)).min(1, "At least one working day required"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM"),
  maxPatientsPerSession: z.number().int().positive().default(40),
  breakPeriods: z.array(breakPeriodSchema).default([]),
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type DoctorSchedule = z.infer<typeof doctorScheduleSchema>;

export const opdSessionStatusSchema = z.enum([
  "scheduled",
  "active",
  "paused",
  "completed",
  "cancelled",
]);

export type OPDSessionStatus = z.infer<typeof opdSessionStatusSchema>;

export const opdSessionSchema = z.object({
  id: z.string().min(1, "Session ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  departmentName: z.string().min(1, "Department name is required"),
  doctorId: z.string().min(1, "Doctor ID is required"),
  doctorName: z.string().min(1, "Doctor name is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM"),
  status: opdSessionStatusSchema.default("scheduled"),
  currentRunningToken: z.number().int().nonnegative().optional(),
  totalTokensIssued: z.number().int().nonnegative().default(0),
  completedCount: z.number().int().nonnegative().default(0),
  waitingCount: z.number().int().nonnegative().default(0),
  startedAt: timestampSchema.optional(),
  completedAt: timestampSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type OPDSession = z.infer<typeof opdSessionSchema>;
