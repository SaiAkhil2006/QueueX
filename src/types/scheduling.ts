import type { z } from "zod";
import {
  doctorScheduleSchema,
  createDoctorScheduleSchema,
  updateDoctorScheduleSchema,
  scheduleBreakSchema,
  breakPeriodSchema,
  opdSessionSchema,
  createOPDSessionSchema,
  updateOPDSessionSchema,
  opdSessionStatusSchema,
} from "@/schemas/scheduling.schema";

export type DoctorSchedule = z.infer<typeof doctorScheduleSchema>;
export type CreateDoctorScheduleInput = z.infer<typeof createDoctorScheduleSchema>;
export type UpdateDoctorScheduleInput = z.infer<typeof updateDoctorScheduleSchema>;
export type ScheduleBreak = z.infer<typeof scheduleBreakSchema>;
export type BreakPeriod = ScheduleBreak; // Backward compatibility alias

export type OPDSession = z.infer<typeof opdSessionSchema>;
export type CreateOPDSessionInput = z.infer<typeof createOPDSessionSchema>;
export type UpdateOPDSessionInput = z.infer<typeof updateOPDSessionSchema>;
export type OPDSessionStatus = z.infer<typeof opdSessionStatusSchema>;

export {
  doctorScheduleSchema,
  createDoctorScheduleSchema,
  updateDoctorScheduleSchema,
  scheduleBreakSchema,
  breakPeriodSchema,
  opdSessionSchema,
  createOPDSessionSchema,
  updateOPDSessionSchema,
  opdSessionStatusSchema,
};
