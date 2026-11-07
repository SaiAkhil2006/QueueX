import type { z } from "zod";
import {
  hospitalSchema,
  createHospitalSchema,
  updateHospitalSchema,
  hospitalStatusSchema,
  hospitalConfigurationSchema,
} from "@/schemas/hospital.schema";

export type Hospital = z.infer<typeof hospitalSchema>;
export type CreateHospitalInput = z.infer<typeof createHospitalSchema>;
export type UpdateHospitalInput = z.infer<typeof updateHospitalSchema>;
export type HospitalStatus = z.infer<typeof hospitalStatusSchema>;
export type HospitalConfiguration = z.infer<typeof hospitalConfigurationSchema>;

export {
  hospitalSchema,
  createHospitalSchema,
  updateHospitalSchema,
  hospitalStatusSchema,
  hospitalConfigurationSchema,
};
