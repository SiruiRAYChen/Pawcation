import { differenceInCalendarDays, isBefore, startOfDay } from "date-fns";
import { DateRange } from "react-day-picker";

export const MAX_TRIP_DAYS = 7;

export type DateRangeValidationResult =
  | { valid: true; length: number }
  | { valid: false; reason: "start-before-today" | "end-not-after-start" | "too-long" | "incomplete" };

export const getTripLengthDays = (from: Date, to: Date) =>
  differenceInCalendarDays(to, from) + 1;

export const validateDateRange = (
  range: DateRange,
  today: Date,
  maxDays = MAX_TRIP_DAYS,
): DateRangeValidationResult => {
  if (!range.from || !range.to) {
    return { valid: false, reason: "incomplete" };
  }

  const normalizedToday = startOfDay(today);
  const normalizedStart = startOfDay(range.from);

  if (isBefore(normalizedStart, normalizedToday)) {
    return { valid: false, reason: "start-before-today" };
  }

  const length = getTripLengthDays(range.from, range.to);

  if (length <= 1) {
    return { valid: false, reason: "end-not-after-start" };
  }

  if (length > maxDays) {
    return { valid: false, reason: "too-long" };
  }

  return { valid: true, length };
};
