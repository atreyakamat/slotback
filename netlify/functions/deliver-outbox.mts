/**
 * Netlify scheduled function: every 5 minutes, asks the app to deliver due outbox messages.
 * Scheduled functions only run on the published production deploy.
 * Needs CRON_SECRET set in the site's environment variables (same value the app reads).
 */
export default async function deliverOutbox() {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    console.warn("deliver-outbox: URL or CRON_SECRET missing, skipping");
    return new Response("skipped", { status: 200 });
  }
  const res = await fetch(`${base}/api/cron/deliver`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  const text = await res.text();
  if (!res.ok) console.error(`deliver-outbox: ${res.status} ${text}`);
  else console.log(`deliver-outbox: ${text}`);
  return new Response(null, { status: 204 });
}

export const config = { schedule: "*/5 * * * *" };
