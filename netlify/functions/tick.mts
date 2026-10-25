import type { Config } from "@netlify/functions";

/**
 * Runs every minute: expires stale offers/campaigns and delivers queued messages
 * (for example, offers held back during quiet hours).
 */
const tick = async () => {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    console.warn("tick skipped: URL or CRON_SECRET not set");
    return;
  }
  const res = await fetch(`${base}/api/cron/tick`, { method: "POST", headers: { authorization: `Bearer ${secret}` } });
  if (!res.ok) console.error(`tick failed: ${res.status}`);
};

export default tick;

export const config: Config = { schedule: "* * * * *" };
