import type { Timestamp } from "firebase-admin/firestore";
import type { TimestampInput } from "@/lib/firebase/timestamps";

/**
 * ============================================================================
 * QueueX Timestamp Architecture & Conventions
 * ============================================================================
 * QueueX uses three distinct timestamp representations depending on context:
 *
 * 1. Firestore Timestamp (`Timestamp`):
 *    - Native Firestore database type (seconds + nanoseconds).
 *    - Used exclusively in backend Firestore document persistence.
 *
 * 2. JavaScript Date (`Date`):
 *    - Native JavaScript runtime object.
 *    - Used in server-side business logic, algorithms, and time difference calculations.
 *
 * 3. Serialized ISO String (`string`, e.g. "2026-11-07T09:30:00.000Z"):
 *    - Standard ISO 8601 string representation.
 *    - Used in Next.js Route Handler JSON payloads, Client Components, and URL state.
 *
 * Utility helpers in `@/lib/firebase/timestamps` convert seamlessly between all three.
 * ============================================================================
 */

export type DateString = `${number}-${number}-${number}`; // YYYY-MM-DD
export type TimeString = `${number}:${number}`; // HH:MM (24-hour)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday ... 6 = Saturday

export interface WithTimestamps {
  createdAt: TimestampInput;
  updatedAt: TimestampInput;
}

export interface IdField {
  id: string;
}

/**
 * Transforms an entity type by converting any timestamp/Date fields into serialized ISO strings.
 * Used for client-side view models and Next.js page props.
 */
export type Serialized<T> = {
  [K in keyof T]: T[K] extends Timestamp | Date
    ? string
    : T[K] extends (infer U)[]
    ? Serialized<U>[]
    : T[K] extends object
    ? Serialized<T[K]>
    : T[K];
};

/**
 * Standard API response wrapper for Next.js Route Handlers.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
