"use server";

import { redirect } from "next/navigation";
import { db } from "../db";
import { env } from "../env";
import { createSession, destroySession } from "../auth/session";
import { demoSessionTarget } from "../demo/target";

/** One-click login into the fictional demo workspace. Creates it on first use. */
export async function demoLogin() {
  if (!env().DEMO_MODE) redirect("/login?error=demo-disabled");

  const session = await demoSessionTarget(db);
  await createSession(session);
  redirect("/app");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
