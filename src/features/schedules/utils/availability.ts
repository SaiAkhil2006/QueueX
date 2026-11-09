import type { ScheduleBreak } from "@/types/scheduling";
import type {
  SerializedDoctorSchedule,
  AvailabilityResult,
} from "../types";

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Validates that operating hours and break periods are mathematically consistent.
 * Throws an Error with descriptive message if invalid.
 */
export function validateScheduleTiming(
  startTime: string,
  endTime: string,
  breakPeriods: ScheduleBreak[] = []
): void {
  if (startTime >= endTime) {
    throw new Error(
      `Start time (${startTime}) must be strictly before end time (${endTime})`
    );
  }

  // Validate each break period
  for (const b of breakPeriods) {
    if (b.startTime >= b.endTime) {
      throw new Error(
        `Break "${b.label}" start time (${b.startTime}) must be before end time (${b.endTime})`
      );
    }
    if (b.startTime < startTime || b.endTime > endTime) {
      throw new Error(
        `Break "${b.label}" (${b.startTime} - ${b.endTime}) must fall entirely within operating hours (${startTime} - ${endTime})`
      );
    }
  }

  // Validate that break periods do not overlap
  const sortedBreaks = [...breakPeriods].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  for (let i = 0; i < sortedBreaks.length - 1; i++) {
    const current = sortedBreaks[i];
    const next = sortedBreaks[i + 1];
    if (current.endTime > next.startTime) {
      throw new Error(
        `Break "${current.label}" (${current.startTime} - ${current.endTime}) overlaps with break "${next.label}" (${next.startTime} - ${next.endTime})`
      );
    }
  }
}

/**
 * Deterministically calculates a doctor's availability at a specific date and time based on their schedule.
 */
export function calculateDoctorAvailability(
  schedule: SerializedDoctorSchedule | null | undefined,
  dateStr: string,
  timeStr?: string
): AvailabilityResult {
  // Normalize date and day of week
  const dateObj = new Date(`${dateStr}T12:00:00Z`);
  const dayOfWeek = isNaN(dateObj.getDay())
    ? new Date().getDay()
    : dateObj.getDay();
  const dayName = DAY_NAMES[dayOfWeek];

  const now = new Date();
  const targetTime =
    timeStr ||
    `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

  if (!schedule) {
    return {
      isAvailable: false,
      status: "off_duty",
      reason: "No operating schedule configured for this doctor",
      targetDate: dateStr,
      targetTime,
      dayOfWeek,
      dayName,
    };
  }

  if (!schedule.isActive) {
    return {
      isAvailable: false,
      status: "inactive",
      reason: "This doctor's schedule is marked as inactive",
      targetDate: dateStr,
      targetTime,
      dayOfWeek,
      dayName,
      shiftHours: {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
    };
  }

  // Check if doctor works on this day
  if (!schedule.workingDays.includes(dayOfWeek)) {
    return {
      isAvailable: false,
      status: "not_working_day",
      reason: `Doctor does not have OPD sessions on ${dayName}`,
      targetDate: dateStr,
      targetTime,
      dayOfWeek,
      dayName,
      shiftHours: {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
    };
  }

  // Check if current time is before shift start
  if (targetTime < schedule.startTime) {
    return {
      isAvailable: false,
      status: "outside_hours",
      reason: `OPD session has not started yet. Begins at ${schedule.startTime}`,
      targetDate: dateStr,
      targetTime,
      dayOfWeek,
      dayName,
      shiftHours: {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
      nextAvailableTime: schedule.startTime,
    };
  }

  // Check if current time is after shift end
  if (targetTime >= schedule.endTime) {
    return {
      isAvailable: false,
      status: "outside_hours",
      reason: `OPD operating hours concluded at ${schedule.endTime}`,
      targetDate: dateStr,
      targetTime,
      dayOfWeek,
      dayName,
      shiftHours: {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
    };
  }

  // Check break periods
  if (schedule.breakPeriods && schedule.breakPeriods.length > 0) {
    for (const b of schedule.breakPeriods) {
      if (targetTime >= b.startTime && targetTime < b.endTime) {
        return {
          isAvailable: false,
          status: "on_break",
          reason: `Doctor is on ${b.label} until ${b.endTime}`,
          targetDate: dateStr,
          targetTime,
          dayOfWeek,
          dayName,
          shiftHours: {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          },
          currentBreak: b,
          nextAvailableTime: b.endTime,
        };
      }
    }
  }

  // If all checks pass, doctor is available
  return {
    isAvailable: true,
    status: "available",
    reason: "Doctor is on duty and available for consultations",
    targetDate: dateStr,
    targetTime,
    dayOfWeek,
    dayName,
    shiftHours: {
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    },
  };
}
