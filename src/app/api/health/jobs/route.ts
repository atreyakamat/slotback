import { connection } from "next/server";
import { db } from "@/server/db";

/** Messages this late mean the every-minute job isn't running. */
const BEHIND_MS = 5 * 60_000;

/**
 * For an uptime monitor: 503 when queued messages are more than 5 minutes late (the scheduled
 * job has stopped) or the database is down. Only counts are returned, never customer data.
 */
export async function GET() {
  await connection();
  try {
    const now = Date.now();
    const [overdue, failedLastHour] = await Promise.all([
      db.outboxMessage.count({ where: { status: "QUEUED", nextAttemptAt: { lt: new Date(now - BEHIND_MS) } } }),
      db.outboxMessage.count({ where: { status: "FAILED", createdAt: { gt: new Date(now - 3_600_000) } } }),
    ]);
    const ok = overdue === 0;
    return Response.json(
      { status: ok ? "ok" : "behind", overdueMessages: overdue, failedMessagesLastHour: failedLastHour },
      { status: ok ? 200 : 503 },
    );
  } catch {
    return Response.json({ status: "degraded", database: "unreachable" }, { status: 503 });
  }
}
