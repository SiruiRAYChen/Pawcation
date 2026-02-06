import { validateDateRange } from "@/components/plan/dateRangeUtils";
import { describe, expect, it } from "vitest";

const makeDate = (value: string) => new Date(`${value}T00:00:00`);

describe("validateDateRange", () => {
  it("rejects start dates before today", () => {
    const today = makeDate("2026-02-06");
    const range = { from: makeDate("2026-02-05"), to: makeDate("2026-02-07") };
    const result = validateDateRange(range, today, 7);
    expect(result).toEqual({ valid: false, reason: "start-before-today" });
  });

  it("rejects end dates that are not after start", () => {
    const today = makeDate("2026-02-06");
    const range = { from: makeDate("2026-02-08"), to: makeDate("2026-02-08") };
    const result = validateDateRange(range, today, 7);
    expect(result).toEqual({ valid: false, reason: "end-not-after-start" });
  });

  it("rejects ranges longer than 7 days", () => {
    const today = makeDate("2026-02-06");
    const range = { from: makeDate("2026-02-10"), to: makeDate("2026-02-18") };
    const result = validateDateRange(range, today, 7);
    expect(result).toEqual({ valid: false, reason: "too-long" });
  });
});
