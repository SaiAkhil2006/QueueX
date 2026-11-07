import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

/**
 * Union type representing acceptable timestamp representations across QueueX.
 * Supports native Firestore Timestamps, JavaScript Dates, ISO 8601 strings, and numeric epochs.
 */
export type TimestampInput = Timestamp | Date | string | number;

/**
 * Checks if a value is a Firestore Timestamp object.
 */
export function isFirestoreTimestamp(val: unknown): val is Timestamp {
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
 * Converts any valid TimestampInput into a Firestore Timestamp instance.
 */
export function toFirestoreTimestamp(input: TimestampInput = new Date()): Timestamp {
  if (isFirestoreTimestamp(input)) {
    return input;
  }
  const d = toDate(input);
  if (!d) {
    throw new Error(`Invalid timestamp input: ${String(input)}`);
  }
  return Timestamp.fromDate(d);
}

/**
 * Returns a new Firestore Timestamp representing the current moment.
 */
export function nowTimestamp(): Timestamp {
  return Timestamp.now();
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
