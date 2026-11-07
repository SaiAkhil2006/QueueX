import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";
import { OPD_SESSION_STATUSES } from "@/constants";

export const scheduleBreakSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM"),
  label: z.string().min(1, "Break label is required"),
});

// Backward-compatibility alias
export const breakPeriodSchema = scheduleBreakSchema;

export const doctorScheduleSchema = z.object({
  id: z.string().min(1, "Schedule ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  doctorId: z.string().min(1, "Doctor ID is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  workingDays: z.array(z.number().int().min(0).max(6)).min(1, "At least one working day required"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM"),
  maxPatientsPerSession: z.number().int().positive().default(40),
  breakPeriods: z.array(scheduleBreakSchema).default([]),
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const createDoctorScheduleSchema = doctorScheduleSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string().optional(),
  });

export const opdSessionStatusSchema = z.enum(OPD_SESSION_STATUSES);

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
  currentRunningToken: z.number().int().nonnegative().optional().nullable(),
  totalTokensIssued: z.number().int().nonnegative().default(0),
  completedCount: z.number().int().nonnegative().default(0),
  waitingCount: z.number().int().nonnegative().default(0),
  startedAt: timestampSchema.optional().nullable(),
  completedAt: timestampSchema.optional().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const createOPDSessionSchema = opdSessionSchema
  .omit({
    id: true,
    totalTokensIssued: true,
    completedCount: true,
    waitingCount: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string().optional(),
    totalTokensIssued: z.number().int().nonnegative().default(0),
    completedCount: z.number().int().nonnegative().default(0),
    waitingCount: z.number().int().nonnegative().default(0),
  });

export const updateOPDSessionSchema = opdSessionSchema
  .omit({
    hospitalId: true,
    departmentId: true,
    doctorId: true,
  })
  .partial();
