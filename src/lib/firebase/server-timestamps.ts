import { Timestamp } from "firebase-admin/firestore";
import {
  isFirestoreTimestamp,
  toDate,
  type TimestampInput,
} from "./timestamps";

/**
 * Converts any valid TimestampInput into a native Firestore Timestamp instance.
 * Server-only utility for Firebase Admin Firestore writes.
 */
export function toFirestoreTimestamp(input: TimestampInput = new Date()): Timestamp {
  if (isFirestoreTimestamp(input)) {
    return input as Timestamp;
  }
  const d = toDate(input);
  if (!d) {
    throw new Error(`Invalid timestamp input: ${String(input)}`);
  }
  return Timestamp.fromDate(d);
}

/**
 * Returns a new Firestore Timestamp representing the current moment.
 * Server-only utility for Firebase Admin Firestore writes.
 */
export function nowTimestamp(): Timestamp {
  return Timestamp.now();
}
