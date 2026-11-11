"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { canManage, requireMember, toActor } from "../auth/dal";
import { db } from "../db";
import { DomainError } from "../domain/errors";
import { createIntegration, revokeIntegration, updateIntegration } from "../domain/integrations";
import { env } from "../env";
import { signingSecret } from "../integrations/webhooks";
import { fromError, fromZod, type ActionState } from "./result";

async function requireManager() {
  const member = await requireMember();
  if (!canManage(member)) throw new DomainError("forbidden", "Only owners and admins can manage connections.");
  return member;
}

const schema = z.object({
  name: z.string().trim().min(2, "Name the connection.").max(60),
  webhookUrl: z.string().trim().max(500).optional().transform((v) => v || null),
  autoRefill: z.preprocess((v) => v === "on", z.boolean()),
});

/** The secret key is in this reply once and never again. */
export type CreateIntegrationState = ActionState & { key?: string; signingSecret?: string; name?: string };

export async function createIntegrationAction(_prev: CreateIntegrationState, form: FormData): Promise<CreateIntegrationState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const member = await requireManager();
    const { integration, key } = await createIntegration(db, toActor(member), parsed.data);
    refresh();
    return { ok: true, key, name: integration.name, signingSecret: signingSecret(integration.id, env().SESSION_SECRET) };
  } catch (err) {
    return fromError(err);
  }
}

export async function updateIntegrationAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const member = await requireManager();
    await updateIntegration(db, toActor(member), String(form.get("id")), parsed.data);
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true, message: "Saved." };
}

export async function revokeIntegrationAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const member = await requireManager();
    await revokeIntegration(db, toActor(member), String(form.get("id")));
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true, message: "Connection removed. Its key stops working now." };
}
