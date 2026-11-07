/**
 * Centralized Constants for QueueX Application.
 */

export * from "./statuses";

export const APP_NAME = "QueueX";
export const APP_VERSION = "0.1.0";

export const DEFAULT_OPD_HOURS = {
  morningStart: "08:30",
  morningEnd: "13:30",
  eveningStart: "16:00",
  eveningEnd: "20:00",
} as const;

export const REFRESH_INTERVALS = {
  QUEUE_METRICS_MS: 15_000,
  DOCTOR_STATUS_MS: 30_000,
  ALERTS_MS: 10_000,
} as const;
