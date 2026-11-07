/**
 * Core domain types for QueueX Outpatient Department (OPD) queue management system.
 */

export type QueueStatus = "waiting" | "in_consultation" | "completed" | "cancelled" | "delayed";

export type PriorityLevel = "normal" | "priority" | "emergency";

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
