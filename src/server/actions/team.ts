"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireMember, toActor } from "../auth/dal";
import { db } from "../db";
import { normalizeEmail } from "../domain/accounts";
import { changeRole, createInvite, removeMember, revokeInvite } from "../domain/team";
import { env } from "../env";
import { fromError, fromZod, type ActionState } from "./result";

/** The link is returned once, right after creating the invite; only its hash is stored. */
export type InviteState = ActionState & { link?: string; name?: string; email?: string };

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Add their name.").max(80),
  email: z.email("Enter a valid email address.").max(160).transform(normalizeEmail),
  role: z.enum(["ADMIN", "STAFF"]),
});

async function teamActor() {
  const member = await requireMember();
  return { ...toActor(member), role: member.role };
}

export async function inviteAction(_prev: InviteState, form: FormData): Promise<InviteState> {
  // Sent back on errors so the form keeps what was typed after React resets it.
  const typed = { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? "") };
  const parsed = inviteSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ...fromZod(parsed.error), ...typed };
  try {
    const { token } = await createInvite(db, await teamActor(), parsed.data);
    refresh();
    return { ok: true, link: `${env().NEXT_PUBLIC_APP_URL}/invite/${token}`, name: parsed.data.name, email: parsed.data.email };
  } catch (err) {
    return { ...fromError(err), ...typed };
  }
}

export async function revokeInviteAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await revokeInvite(db, await teamActor(), String(form.get("id")));
    refresh();
    return { ok: true, message: "Invite cancelled. The link no longer works." };
  } catch (err) {
    return fromError(err);
  }
}

export async function changeRoleAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.object({ id: z.string().min(1), role: z.enum(["ADMIN", "STAFF"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await changeRole(db, await teamActor(), parsed.data.id, parsed.data.role);
    refresh();
    return { ok: true, message: "Role updated." };
  } catch (err) {
    return fromError(err);
  }
}

export async function removeMemberAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await removeMember(db, await teamActor(), String(form.get("id")));
    refresh();
    return { ok: true, message: "Removed. They lose access straight away." };
  } catch (err) {
    return fromError(err);
  }
}
