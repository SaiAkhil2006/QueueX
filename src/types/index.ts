/**
 * Core domain types and Zod schemas for QueueX Outpatient Department (OPD) queue management system.
 */

export * from "./common";
export * from "./hospital";
export * from "./department";
export * from "./doctor";
export * from "./scheduling";
export * from "./patient";
export * from "./appointment";
export * from "./queue";
export * from "./consultation";
export * from "./operations";
export * from "./intelligence";


// General System & UI types
export type DepartmentType =
  | "general_medicine"
  | "pediatrics"
  | "cardiology"
  | "orthopedics"
  | "dermatology"
  | "ent";

export interface SystemStatus {
  service: string;
  version: string;
  status: "healthy" | "degraded" | "down";
  timestamp: string;
}

export interface OperationalMetric {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  description: string;
}
