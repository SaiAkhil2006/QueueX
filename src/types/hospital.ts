import { z } from "zod";
import { timestampSchema, type TimestampInput } from "@/lib/firebase/timestamps";

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
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Hospital = z.infer<typeof hospitalSchema>;

export type CreateHospitalInput = z.infer<
  typeof hospitalSchema
> extends infer T
  ? Omit<T, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
      createdAt?: TimestampInput;
      updatedAt?: TimestampInput;
    }
  : never;
