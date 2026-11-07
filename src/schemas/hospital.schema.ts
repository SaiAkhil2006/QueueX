import { z } from "zod";
import { timestampSchema } from "@/lib/firebase/timestamps";
import { HOSPITAL_STATUSES } from "@/constants";

export const hospitalStatusSchema = z.enum(HOSPITAL_STATUSES);

export const hospitalConfigurationSchema = z.object({
  opdMorningStartTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM")
    .default("08:30"),
  opdMorningEndTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM")
    .default("13:30"),
  opdEveningStartTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM")
    .default("16:00"),
  opdEveningEndTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:MM")
    .default("20:00"),
  emergencyWaitThresholdMinutes: z.number().int().positive().default(10),
  maxActiveQueuesPerDoctor: z.number().int().positive().default(1),
  autoCallNextEnabled: z.boolean().default(false),
});

export const hospitalSchema = z.object({
  id: z.string().min(1, "Hospital ID is required"),
  name: z.string().min(1, "Hospital name is required"),
  code: z.string().min(2, "Hospital code must be at least 2 characters").toUpperCase(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().default("Andhra Pradesh"),
  postalCode: z.string().min(4, "Postal code is required"),
  timezone: z.string().default("Asia/Kolkata"),
  phone: z.string().min(7, "Valid phone number is required"),
  email: z.string().email("Valid email address is required"),
  status: hospitalStatusSchema.default("active"),
  isActive: z.boolean().default(true),
  configuration: hospitalConfigurationSchema.default({
    opdMorningStartTime: "08:30",
    opdMorningEndTime: "13:30",
    opdEveningStartTime: "16:00",
    opdEveningEndTime: "20:00",
    emergencyWaitThresholdMinutes: 10,
    maxActiveQueuesPerDoctor: 1,
    autoCallNextEnabled: false,
  }),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const createHospitalSchema = hospitalSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string().optional(),
  });

export const updateHospitalSchema = createHospitalSchema.partial();
