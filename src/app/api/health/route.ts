import { connection } from "next/server";
import { db } from "@/server/db";

/** Liveness + database reachability, for uptime checks. */
export async function GET() {
  await connection();
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "degraded", database: "unreachable" }, { status: 503 });
  }
}
