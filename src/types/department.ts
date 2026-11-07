import type { z } from "zod";
import {
  departmentSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentStatusSchema,
} from "@/schemas/department.schema";

export type Department = z.infer<typeof departmentSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type DepartmentStatus = z.infer<typeof departmentStatusSchema>;

export {
  departmentSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentStatusSchema,
};
