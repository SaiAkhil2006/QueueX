import { z } from "zod";
import type { Serialized } from "@/types/common";

/**
 * Structural interface matching Firestore Timestamp duck-typing
 * without requiring client-side import of the Node.js firebase-admin package.
 */
export interface FirestoreTimestampLike {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

/**
 * Union type representing acceptable timestamp representations across QueueX.
 * Supports Firestore Timestamps, JavaScript Dates, ISO 8601 strings, and numeric epochs.
 */
export type TimestampInput = FirestoreTimestampLike | Date | string | number;

/**
 * Checks if a value is a Firestore Timestamp object.
 */
export function isFirestoreTimestamp(val: unknown): val is FirestoreTimestampLike {
  return (
    typeof val === "object" &&
    val !== null &&
    "seconds" in val &&
    "nanoseconds" in val &&
    typeof (val as { toDate?: unknown }).toDate === "function"
  );
}

/**
 * Converts any valid TimestampInput into a JavaScript Date object.
 */
export function toDate(input: TimestampInput | null | undefined): Date | null {
  if (input === null || input === undefined) {
    return null;
  }
  if (isFirestoreTimestamp(input)) {
    return input.toDate();
  }
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === "string" || typeof input === "number") {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Converts any valid TimestampInput into an ISO 8601 string representation.
 */
export function toISOString(input: TimestampInput | null | undefined): string | null {
  const d = toDate(input);
  return d ? d.toISOString() : null;
}

/**
 * Returns epoch milliseconds for any valid TimestampInput, or 0 if null/invalid.
 */
export function getTimestampMillis(input: TimestampInput | null | undefined): number {
  if (input === null || input === undefined) return 0;
  if (typeof (input as unknown as { toMillis?: () => number }).toMillis === "function") {
    return (input as unknown as { toMillis: () => number }).toMillis();
  }
  const d = toDate(input);
  return d ? d.getTime() : 0;
}

/**
 * Reusable Zod schema for Firestore-compatible timestamps.
 * Accepts Firestore Timestamp instances, JS Dates, ISO string dates, or millisecond numbers,
 * and validates that they represent a valid date/time.
 */
export const timestampSchema = z.custom<TimestampInput>(
  (val) => {
    if (isFirestoreTimestamp(val)) return true;
    if (val instanceof Date) return !isNaN(val.getTime());
    if (typeof val === "string" || typeof val === "number") {
      const d = new Date(val);
      return !isNaN(d.getTime());
    }
    return false;
  },
  {
    message: "Expected a valid Firestore Timestamp, Date, ISO timestamp string, or millisecond epoch",
  }
);

/**
 * Recursively converts all Firestore Timestamps and JavaScript Dates in an object or array to ISO 8601 strings.
 */
export function serializeTimestamps<T>(data: T): Serialized<T> {
  if (data === null || data === undefined) {
    return data as Serialized<T>;
  }
  if (isFirestoreTimestamp(data)) {
    return data.toDate().toISOString() as Serialized<T>;
  }
  if (data instanceof Date) {
    return data.toISOString() as Serialized<T>;
  }
  if (Array.isArray(data)) {
    return data.map((item) => serializeTimestamps(item)) as Serialized<T>;
  }
  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeTimestamps(value);
    }
    return result as Serialized<T>;
  }
  return data as Serialized<T>;
}
