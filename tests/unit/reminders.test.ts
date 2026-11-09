import { describe, expect, it } from "vitest";
import { describeOffset, isQuietMinute, moveAfterQuietHours, moveBeforeQuietHours, planReminders } from "@/lib/reminders";
import { zonedToUtc } from "@/lib/time";

const IST = "Asia/Kolkata";
const quiet = { start: "21:00", end: "09:00" };
const at = (date: string, hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return zonedToUtc(date, h * 60 + m, IST);
};

describe("quiet hours", () => {
  it("handles windows that wrap midnight", () => {
    expect(isQuietMinute(21 * 60, quiet)).toBe(true);
    expect(isQuietMinute(23 * 60, quiet)).toBe(true);
    expect(isQuietMinute(8 * 60 + 59, quiet)).toBe(true);
    expect(isQuietMinute(9 * 60, quiet)).toBe(false);
    expect(isQuietMinute(20 * 60 + 59, quiet)).toBe(false);
  });

  it("handles same-day windows and disabled windows", () => {
    expect(isQuietMinute(13 * 60 + 30, { start: "13:00", end: "14:00" })).toBe(true);
    expect(isQuietMinute(14 * 60, { start: "13:00", end: "14:00" })).toBe(false);
    expect(isQuietMinute(3 * 60, { start: "00:00", end: "00:00" })).toBe(false);
  });

  it("moves an early-morning time to the previous evening", () => {
    expect(moveBeforeQuietHours(at("2026-11-10", "07:30"), quiet, IST)).toEqual(at("2026-11-09", "20:45"));
  });

  it("moves a late-evening time to earlier the same evening", () => {
    expect(moveBeforeQuietHours(at("2026-11-10", "22:15"), quiet, IST)).toEqual(at("2026-11-10", "20:45"));
  });

  it("defers to the end of quiet hours", () => {
    expect(moveAfterQuietHours(at("2026-11-10", "22:15"), quiet, IST)).toEqual(at("2026-11-11", "09:00"));
    expect(moveAfterQuietHours(at("2026-11-10", "06:00"), quiet, IST)).toEqual(at("2026-11-10", "09:00"));
    expect(moveAfterQuietHours(at("2026-11-10", "12:00"), quiet, IST)).toEqual(at("2026-11-10", "12:00"));
  });
});

describe("planReminders", () => {
  const plan = (start: Date, now: Date, offsets = [1440, 120]) =>
    planReminders({ startAt: start, offsetsMinutes: offsets, now, quiet, timeZone: IST });

  it("schedules 24h and 2h reminders for an afternoon appointment", () => {
    const start = at("2026-11-12", "17:00");
    expect(plan(start, at("2026-11-08", "12:00"))).toEqual([
      { offsetMinutes: 1440, sendAt: at("2026-11-11", "17:00") },
      { offsetMinutes: 120, sendAt: at("2026-11-12", "15:00") },
    ]);
  });

  it("sends a would-be 8am reminder the evening before instead", () => {
    const start = at("2026-11-12", "10:00");
    const r = plan(start, at("2026-11-08", "12:00"));
    expect(r.map((x) => x.sendAt)).toEqual([at("2026-11-11", "10:00"), at("2026-11-11", "20:45")]);
  });

  it("skips reminders whose time has passed (late bookings)", () => {
    const start = at("2026-11-12", "17:00");
    expect(plan(start, at("2026-11-12", "13:00"))).toEqual([{ offsetMinutes: 120, sendAt: at("2026-11-12", "15:00") }]);
    expect(plan(start, at("2026-11-12", "16:00"))).toEqual([]);
  });

  it("merges reminders that would land within an hour of each other", () => {
    const start = at("2026-11-12", "17:00");
    expect(plan(start, at("2026-11-08", "12:00"), [120, 90]).map((r) => r.offsetMinutes)).toEqual([120]);
  });

  it("ignores invalid and duplicate offsets", () => {
    const start = at("2026-11-12", "17:00");
    expect(plan(start, at("2026-11-08", "12:00"), [120, 120, -5, 0, 1.5]).map((r) => r.offsetMinutes)).toEqual([120]);
  });
});

describe("describeOffset", () => {
  it("reads naturally", () => {
    expect(describeOffset(2880)).toBe("2 days");
    expect(describeOffset(1440)).toBe("24 hours");
    expect(describeOffset(60)).toBe("1 hour");
    expect(describeOffset(30)).toBe("30 minutes");
  });
});
