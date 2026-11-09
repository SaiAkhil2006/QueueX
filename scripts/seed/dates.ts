import { toFirestoreTimestamp } from "@/lib/firebase/server-timestamps";
import type { Timestamp } from "firebase-admin/firestore";

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

/**
 * Returns an ISO date string (YYYY-MM-DD) for a given offset relative to baseDate in Asia/Kolkata timezone.
 *
 * @param offsetDays Number of days relative to baseDate (e.g., -2, -1, 0, 1, 2)
 * @param baseDate The reference date (defaults to current system date)
 */
export function getKolkataDateString(offsetDays: number = 0, baseDate: Date = new Date()): string {
  const target = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(target);
}

/**
 * Creates a standard Date object representing a specific date and time in Asia/Kolkata (UTC+05:30).
 *
 * @param dateStr Date in format YYYY-MM-DD
 * @param timeStr Time in format HH:MM
 */
export function createKolkataDateTime(dateStr: string, timeStr: string): Date {
  // Asia/Kolkata is UTC+05:30 with no daylight saving time shifts.
  const isoString = `${dateStr}T${timeStr}:00+05:30`;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date/time combination: date=${dateStr}, time=${timeStr}`);
  }
  return date;
}

/**
 * Creates a Firestore Timestamp for a specific date and time in Asia/Kolkata.
 */
export function createKolkataTimestamp(dateStr: string, timeStr: string): Timestamp {
  return toFirestoreTimestamp(createKolkataDateTime(dateStr, timeStr));
}

/**
 * Returns a new Date offset by the given number of minutes.
 */
export function addMinutesToDate(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Returns a new Date offset by the given number of seconds.
 */
export function addSecondsToDate(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}
