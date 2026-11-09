/**
 * Date and timing helpers for OPD Sessions in QueueX.
 * Uses Asia/Kolkata timezone (UTC+05:30) as standard for hospital operations.
 */

export const ASIA_KOLKATA = "Asia/Kolkata";

/**
 * Returns today's date in YYYY-MM-DD format according to Asia/Kolkata.
 */
export function getTodayDateString(baseDate: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ASIA_KOLKATA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(baseDate);
}

/**
 * Returns the Day of Week integer (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * for a YYYY-MM-DD date string in Asia/Kolkata timezone.
 */
export function getDayOfWeekFromDateString(dateStr: string): number {
  // Construct noon UTC+05:30 to avoid boundary edge cases
  const dt = new Date(`${dateStr}T12:00:00+05:30`);
  return dt.getDay();
}

/**
 * Checks if two time ranges (HH:MM to HH:MM) overlap.
 * Both times must be in "HH:MM" 24h format.
 */
export function areTimeRangesOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return !(endA <= startB || startA >= endB);
}

/**
 * Formats a 24-hour time string "14:30" to "2:30 PM".
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr || "00";
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}
