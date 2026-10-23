import { describe, expect, it } from "vitest";
import { addDays, localDateKey, localMinuteOfDay, localWeekday, parseHm, zonedToUtc, zoneOffsetMinutes } from "@/lib/time";

const IST = "Asia/Kolkata";

describe("time helpers", () => {
  it("knows IST is UTC+05:30", () => {
    expect(zoneOffsetMinutes(new Date("2026-10-23T00:00:00Z"), IST)).toBe(330);
  });

  it("converts Goa wall-clock time to UTC", () => {
    expect(zonedToUtc("2026-10-24", 10 * 60 + 30, IST).toISOString()).toBe("2026-10-24T05:00:00.000Z");
  });

  it("handles local midnight, which is the previous UTC day", () => {
    expect(zonedToUtc("2026-10-24", 0, IST).toISOString()).toBe("2026-10-23T18:30:00.000Z");
  });

  it("round-trips through local parts", () => {
    const t = zonedToUtc("2026-10-25", 19 * 60 + 15, IST);
    expect(localDateKey(t, IST)).toBe("2026-10-25");
    expect(localMinuteOfDay(t, IST)).toBe(19 * 60 + 15);
    expect(localWeekday(t, IST)).toBe(0); // Sunday
  });

  it("respects DST where it exists", () => {
    // London is UTC+1 in summer, UTC+0 in winter.
    expect(zonedToUtc("2026-07-01", 9 * 60, "Europe/London").toISOString()).toBe("2026-07-01T08:00:00.000Z");
    expect(zonedToUtc("2026-12-01", 9 * 60, "Europe/London").toISOString()).toBe("2026-12-01T09:00:00.000Z");
  });

  it("adds days across month ends", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(parseHm("09:45")).toBe(585);
  });
});
