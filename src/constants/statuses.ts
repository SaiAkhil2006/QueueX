/**
 * Centralized Domain Status Constants for QueueX.
 *
 * Used as the single source of truth for Zod enum validation schemas,
 * TypeScript string union types, and operational runtime business logic.
 */

// Hospital
export const HOSPITAL_STATUSES = ["active", "inactive", "maintenance"] as const;
export type HospitalStatus = (typeof HOSPITAL_STATUSES)[number];

// Department
export const DEPARTMENT_STATUSES = ["active", "inactive", "suspended"] as const;
export type DepartmentStatus = (typeof DEPARTMENT_STATUSES)[number];

// Doctor
export const DOCTOR_STATUSES = ["active", "inactive", "on_leave"] as const;
export type DoctorStatus = (typeof DOCTOR_STATUSES)[number];

export const DOCTOR_AVAILABILITY = [
  "available",
  "busy",
  "on_break",
  "off_duty",
] as const;
export type DoctorAvailability = (typeof DOCTOR_AVAILABILITY)[number];

// Scheduling & OPD Session
export const OPD_SESSION_STATUSES = [
  "scheduled",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;
export type OPDSessionStatus = (typeof OPD_SESSION_STATUSES)[number];

// Patient
export const PATIENT_STATUSES = ["active", "inactive", "archived"] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

export const PATIENT_GENDERS = ["male", "female", "other"] as const;
export type PatientGender = (typeof PATIENT_GENDERS)[number];

// Appointments
export const APPOINTMENT_STATUSES = [
  "booked",
  "checked_in",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_TYPES = ["regular", "follow_up", "referral"] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

// Live Queue
export const QUEUE_ENTRY_STATUSES = [
  "waiting",
  "called",
  "in_consultation",
  "completed",
  "skipped",
  "cancelled",
] as const;
export type QueueEntryStatus = (typeof QUEUE_ENTRY_STATUSES)[number];

export const QUEUE_PRIORITIES = ["normal", "priority", "emergency"] as const;
export type QueuePriority = (typeof QUEUE_PRIORITIES)[number];

export const QUEUE_SOURCES = ["appointment", "walk_in", "emergency"] as const;
export type QueueSource = (typeof QUEUE_SOURCES)[number];

// Consultations
export const CONSULTATION_STATUSES = [
  "in_progress",
  "completed",
  "discontinued",
] as const;
export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

export const CONSULTATION_OUTCOMES = [
  "prescribed",
  "referred",
  "admitted",
  "tests_ordered",
  "follow_up_needed",
  "routine_clear",
] as const;
export type ConsultationOutcome = (typeof CONSULTATION_OUTCOMES)[number];

// Operational Events
export const OPERATIONAL_EVENT_TYPES = [
  "doctor_paused",
  "doctor_resumed",
  "doctor_unavailable",
  "emergency_patient_added",
  "consultation_started",
  "consultation_completed",
  "patient_skipped",
  "patient_cancelled",
  "queue_delay_detected",
  "room_reassigned",
] as const;
export type OperationalEventType = (typeof OPERATIONAL_EVENT_TYPES)[number];

export const EVENT_SEVERITIES = ["info", "warning", "critical"] as const;
export type EventSeverity = (typeof EVENT_SEVERITIES)[number];

export const ACTOR_ROLES = ["doctor", "nurse", "admin", "system"] as const;
export type ActorRole = (typeof ACTOR_ROLES)[number];

// Intelligence: Predictions & Recommendations
export const PREDICTION_TYPES = [
  "estimated_wait_time",
  "session_completion_time",
  "queue_length_forecast",
  "bottleneck_risk",
] as const;
export type PredictionType = (typeof PREDICTION_TYPES)[number];

export const PREDICTION_CONFIDENCES = ["low", "medium", "high"] as const;
export type PredictionConfidence = (typeof PREDICTION_CONFIDENCES)[number];

export const RECOMMENDATION_TYPES = [
  "rebalance_queue",
  "call_next_doctor",
  "extend_opd_hours",
  "pause_walkins",
  "dispatch_triage_alert",
] as const;
export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number];

export const RECOMMENDATION_PRIORITIES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;
export type RecommendationPriority = (typeof RECOMMENDATION_PRIORITIES)[number];

export const RECOMMENDATION_STATUSES = [
  "pending",
  "applied",
  "dismissed",
] as const;
export type RecommendationStatus = (typeof RECOMMENDATION_STATUSES)[number];
