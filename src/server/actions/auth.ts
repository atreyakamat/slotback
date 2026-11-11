"use server";

import { redirect } from "next/navigation";
import { db } from "../db";
import { env } from "../env";
import { createSession, destroySession } from "../auth/session";
import { demoSessionTarget } from "../demo/target";

/** One-click login into a fictional demo workspace: the salon by default, or the dental clinic. Creates them on first use. */
export async function demoLogin(formData?: FormData) {
  if (!env().DEMO_MODE) redirect("/login?error=demo-disabled");
  const workspace = formData?.get("workspace") === "clinic" ? "clinic" : "salon";

  const session = await demoSessionTarget(db, workspace);
  await createSession(session);
  redirect("/app");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
