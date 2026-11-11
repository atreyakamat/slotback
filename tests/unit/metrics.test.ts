import { describe, expect, it } from "vitest";
import { summarizeRecovery, type CampaignFact } from "@/server/domain/metrics";

const TZ = "Asia/Kolkata";
const now = new Date("2026-10-23T12:00:00Z"); // 17:30 IST
const min = (n: number) => n * 60_000;

function campaign(over: Partial<CampaignFact>): CampaignFact {
  const launchedAt = new Date(now.getTime() - min(24 * 60));
  return {
    id: Math.random().toString(36).slice(2),
    status: "CLAIMED",
    valuePaise: 100000,
    startAt: new Date(launchedAt.getTime() + min(180)),
    launchedAt,
    claimedAt: new Date(launchedAt.getTime() + min(10)),
    offers: [
      { sentAt: launchedAt, openedAt: launchedAt },
      { sentAt: launchedAt, openedAt: null },
    ],
    claim: { appointmentStatus: "COMPLETED" },
    ...over,
  };
}

describe("summarizeRecovery", () => {
  it("separates recovered (claimed) from completed (earned) value", () => {
    const m = summarizeRecovery({
      campaigns: [
        campaign({ valuePaise: 120000 }),
        campaign({ valuePaise: 60000, claim: { appointmentStatus: "NO_SHOW" } }),
        campaign({ valuePaise: 50000, claim: { appointmentStatus: "BOOKED" } }),
      ],
      cancellations: 5,
      days: 7,
      timezone: TZ,
      now,
    });
    expect(m.recoveredPaise).toBe(230000);
    expect(m.completedPaise).toBe(120000);
    expect(m.upcomingPaise).toBe(50000);
    expect(m.funnel).toEqual({ cancellations: 5, offered: 3, messagesSent: 6, opened: 3, claimed: 3, completed: 1 });
  });

  it("computes fill rate over settled campaigns only", () => {
    const m = summarizeRecovery({
      campaigns: [
        campaign({}),
        campaign({ status: "EXPIRED", claimedAt: null, claim: null }),
        campaign({ status: "ACTIVE", claimedAt: null, claim: null }),
        campaign({ status: "DRAFT", launchedAt: null, claimedAt: null, claim: null }),
      ],
      cancellations: 4,
      days: 7,
      timezone: TZ,
      now,
    });
    expect(m.launched).toBe(3);
    expect(m.fillRate).toBe(0.5);
    expect(m.active).toBe(1);
  });

  it("reports no fill rate and no median before anything settles", () => {
    const m = summarizeRecovery({ campaigns: [], cancellations: 0, days: 7, timezone: TZ, now });
    expect(m.fillRate).toBeNull();
    expect(m.medianMinutesToFill).toBeNull();
    expect(m.series).toHaveLength(7);
  });

  it("takes the median minutes to fill", () => {
    const base = new Date(now.getTime() - min(600));
    const m = summarizeRecovery({
      campaigns: [4, 10, 30].map((n) => campaign({ launchedAt: base, claimedAt: new Date(base.getTime() + min(n)) })),
      cancellations: 3,
      days: 7,
      timezone: TZ,
      now,
    });
    expect(m.medianMinutesToFill).toBe(10);
  });

  it("buckets recovered value by the local day it was claimed", () => {
    // 2026-10-22 19:00 UTC is 2026-10-23 00:30 IST: it belongs to the 23rd locally.
    const claimedAt = new Date("2026-10-22T19:00:00Z");
    const m = summarizeRecovery({
      campaigns: [campaign({ launchedAt: new Date(claimedAt.getTime() - min(5)), claimedAt, valuePaise: 90000 })],
      cancellations: 1,
      days: 3,
      timezone: TZ,
      now,
    });
    expect(m.series.map((d) => d.date)).toEqual(["2026-10-21", "2026-10-22", "2026-10-23"]);
    expect(m.series[2]).toMatchObject({ valuePaise: 90000, count: 1 });
    expect(m.series[1].valuePaise).toBe(0);
  });
});
