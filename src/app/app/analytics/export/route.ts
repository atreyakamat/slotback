import { formatDate, formatTime } from "@/lib/time";
import { getMember } from "@/server/auth/dal";
import { getRecoveryMetrics, parseRange } from "@/server/queries/metrics";

/** Quotes a CSV cell and defuses spreadsheet formula injection (cells starting with = + - @). */
function cell(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const member = await getMember();
  if (!member) return new Response("Sign in to export.", { status: 401 });

  const days = parseRange(new URL(request.url).searchParams.get("days") ?? undefined);
  const { campaigns } = await getRecoveryMetrics(member, days);
  const tz = member.location.timezone;

  const header = [
    "Date",
    "Time",
    "Service",
    "Staff",
    "Value (INR)",
    "Outcome",
    "Offers sent",
    "Offers opened",
    "Claimed by",
    "Minutes to refill",
    "Visit status",
  ];
  const rows = campaigns.map((c) => [
    formatDate(c.startAt, tz, { weekday: undefined, year: "numeric" }),
    formatTime(c.startAt, tz),
    c.service.name,
    c.resource.name,
    Math.round(c.valuePaise / 100),
    c.status.toLowerCase(),
    c.offers.filter((o) => o.sentAt).length,
    c.offers.filter((o) => o.openedAt).length,
    c.claim?.appointment.customer?.name ?? "",
    c.claimedAt && c.launchedAt ? Math.round((c.claimedAt.getTime() - c.launchedAt.getTime()) / 60_000) : "",
    c.claim?.appointment.status.toLowerCase().replace("_", " ") ?? "",
  ]);

  // BOM so Excel opens UTF-8 names correctly.
  const csv = "\uFEFF" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="slotback-recovery-${days}d-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
