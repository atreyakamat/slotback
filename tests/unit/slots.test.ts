import { describe, expect, it } from "vitest";
import { bookableDates, freeSlots, openingIntervals, type BusinessHours } from "@/lib/slots";
import { zonedToUtc } from "@/lib/time";

const IST = "Asia/Kolkata";
// Mon–Sat split hours, closed Sunday. 2026-11-10 is a Tuesday; 2026-11-15 is a Sunday.
const hours: BusinessHours = Object.fromEntries(
  [1, 2, 3, 4, 5, 6].map((d) => [
    String(d),
    [
      { open: "10:00", close: "13:30" },
      { open: "16:30", close: "20:30" },
    ],
  ]),
);
const at = (date: string, hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return zonedToUtc(date, h * 60 + m, IST);
};
const base = {
  date: "2026-11-10",
  timeZone: IST,
  hours,
  durationMinutes: 45,
  intervalMinutes: 15,
  resourceIds: ["dr-a"],
  busy: [],
  now: new Date("2026-11-01T00:00:00Z"),
  minLeadMinutes: 60,
};

describe("openingIntervals", () => {
  it("reads split hours for the local weekday", () => {
    expect(openingIntervals(hours, "2026-11-10", IST)).toEqual([
      [600, 810],
      [990, 1230],
    ]);
  });

  it("is empty on a closed day", () => {
    expect(openingIntervals(hours, "2026-11-15", IST)).toEqual([]);
  });

  it("ignores malformed spans", () => {
    expect(openingIntervals({ "2": [{ open: "late", close: "20:00" }, { open: "12:00", close: "11:00" }] }, "2026-11-10", IST)).toEqual([]);
  });
});

describe("freeSlots", () => {
  it("offers every interval where the whole service fits inside opening hours", () => {
    const slots = freeSlots(base);
    // Morning 10:00–12:45 (12 starts), evening 16:30–19:45 (14 starts).
    expect(slots).toHaveLength(12 + 14);
    expect(slots[0].startAt).toEqual(at("2026-11-10", "10:00"));
    expect(slots[11].startAt).toEqual(at("2026-11-10", "12:45"));
    expect(slots.at(-1)!.endAt).toEqual(at("2026-11-10", "20:30"));
  });

  it("skips times that overlap an existing booking, but allows back-to-back", () => {
    const busy = [{ resourceId: "dr-a", startAt: at("2026-11-10", "11:00"), endAt: at("2026-11-10", "12:00") }];
    const starts = freeSlots({ ...base, busy }).map((s) => s.startAt.getTime());
    expect(starts).toContain(at("2026-11-10", "10:15").getTime()); // ends 11:00 exactly
    expect(starts).not.toContain(at("2026-11-10", "10:30").getTime());
    expect(starts).not.toContain(at("2026-11-10", "11:45").getTime());
    expect(starts).toContain(at("2026-11-10", "12:00").getTime());
  });

  it("assigns the first free resource and uses the second when the first is busy", () => {
    const busy = [{ resourceId: "dr-a", startAt: at("2026-11-10", "10:00"), endAt: at("2026-11-10", "11:00") }];
    const slots = freeSlots({ ...base, resourceIds: ["dr-a", "dr-b"], busy });
    expect(slots[0]).toMatchObject({ resourceId: "dr-b" });
    expect(slots.find((s) => s.startAt.getTime() === at("2026-11-10", "11:00").getTime())).toMatchObject({ resourceId: "dr-a" });
  });

  it("respects the minimum lead time", () => {
    const slots = freeSlots({ ...base, now: at("2026-11-10", "10:20"), minLeadMinutes: 60 });
    expect(slots[0].startAt).toEqual(at("2026-11-10", "11:30"));
  });

  it("returns nothing on a closed day or without resources", () => {
    expect(freeSlots({ ...base, date: "2026-11-15" })).toEqual([]);
    expect(freeSlots({ ...base, resourceIds: [] })).toEqual([]);
  });
});

describe("bookableDates", () => {
  it("lists the horizon starting today", () => {
    expect(bookableDates("2026-11-30", 3)).toEqual(["2026-11-30", "2026-12-01", "2026-12-02"]);
  });
});
