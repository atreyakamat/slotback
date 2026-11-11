import { describe, expect, it } from "vitest";
import { evaluateCandidates, inQuietHours, pickChannel, type Candidate, type Slot } from "@/server/domain/eligibility";
import { zonedToUtc } from "@/lib/time";

const TZ = "Asia/Kolkata";
// Saturday 24 Oct 2026, 15:00–16:00 IST.
const slot: Slot = {
  locationId: "loc",
  serviceId: "cut",
  resourceId: "r1",
  startAt: zonedToUtc("2026-10-24", 15 * 60, TZ),
  endAt: zonedToUtc("2026-10-24", 16 * 60, TZ),
  cancelledCustomerId: "canceller",
};

let n = 0;
function candidate(over: Partial<Candidate> = {}): Candidate {
  n++;
  return {
    waitlistEntryId: `w${n}`,
    customerId: `c${n}`,
    name: `Customer ${n}`,
    phone: "+91 90000 00001",
    email: null,
    preferredChannel: "WHATSAPP",
    granted: ["WHATSAPP"],
    entryServiceId: "cut",
    preferredDays: [],
    earliestMinute: 0,
    latestMinute: 1440,
    joinedAt: new Date(`2026-10-0${(n % 9) + 1}T00:00:00Z`),
    busy: false,
    alreadyOffered: false,
    ...over,
  };
}

describe("eligibility", () => {
  it("excludes customers for clear, explainable reasons", () => {
    const results = evaluateCandidates(slot, TZ, [
      candidate({ customerId: "canceller" }),
      candidate({ granted: [] }),
      candidate({ entryServiceId: "colour" }),
      candidate({ preferredDays: [1, 2] }), // Mon, Tue; slot is Saturday
      candidate({ earliestMinute: 10 * 60, latestMinute: 13 * 60 }),
      candidate({ busy: true }),
      candidate({ alreadyOffered: true }),
      candidate({ granted: ["EMAIL"], email: null }),
    ]);
    expect(results.map((r) => (r.eligible ? "eligible" : r.reason))).toEqual([
      "cancelled_this_slot",
      "no_consent",
      "different_service",
      "day_not_preferred",
      "outside_time_window",
      "busy",
      "already_offered",
      "no_contact",
    ]);
  });

  it("requires the whole appointment to fit the customer's window", () => {
    const [r] = evaluateCandidates(slot, TZ, [candidate({ earliestMinute: 12 * 60, latestMinute: 15 * 60 + 30 })]);
    expect(r.eligible).toBe(false);
  });

  it("ranks exact-service requests first, then by who joined earliest", () => {
    const anyEarly = candidate({ entryServiceId: null, joinedAt: new Date("2026-09-01") });
    const exactLate = candidate({ joinedAt: new Date("2026-10-10") });
    const exactEarly = candidate({ joinedAt: new Date("2026-10-01") });
    const results = evaluateCandidates(slot, TZ, [anyEarly, exactLate, exactEarly]);
    expect(results.map((r) => r.candidate.customerId)).toEqual([exactEarly.customerId, exactLate.customerId, anyEarly.customerId]);
    expect(results.map((r) => (r.eligible ? r.rank : null))).toEqual([1, 2, 3]);
  });

  it("falls back from a revoked preferred channel to another consented one", () => {
    expect(pickChannel(candidate({ preferredChannel: "WHATSAPP", granted: ["SMS"] }))).toEqual({ channel: "SMS", address: "+91 90000 00001" });
    expect(pickChannel(candidate({ granted: ["EMAIL"], email: "a@example.com" }))).toEqual({ channel: "EMAIL", address: "a@example.com" });
  });
});

describe("quiet hours", () => {
  it("handles windows that wrap midnight", () => {
    expect(inQuietHours(zonedToUtc("2026-10-24", 22 * 60, TZ), TZ, "21:00", "09:00")).toBe(true);
    expect(inQuietHours(zonedToUtc("2026-10-24", 7 * 60, TZ), TZ, "21:00", "09:00")).toBe(true);
    expect(inQuietHours(zonedToUtc("2026-10-24", 12 * 60, TZ), TZ, "21:00", "09:00")).toBe(false);
  });
  it("handles same-day windows", () => {
    expect(inQuietHours(zonedToUtc("2026-10-24", 14 * 60, TZ), TZ, "13:00", "15:00")).toBe(true);
    expect(inQuietHours(zonedToUtc("2026-10-24", 15 * 60, TZ), TZ, "13:00", "15:00")).toBe(false);
  });

  it("only offers on channels the business can send on", () => {
    const smsOnly = candidate({ granted: ["SMS"], preferredChannel: "SMS" });
    const both = candidate({ granted: ["SMS", "WHATSAPP"], preferredChannel: "SMS" });
    const [eligible, excluded] = evaluateCandidates(slot, TZ, [smsOnly, both], ["WHATSAPP"]);
    expect(eligible).toMatchObject({ eligible: true, channel: "WHATSAPP", candidate: { customerId: both.customerId } });
    expect(excluded).toMatchObject({ eligible: false, reason: "channel_unavailable" });
  });
});
