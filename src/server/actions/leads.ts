"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db } from "../db";
import { createLead, hashIp, VERTICALS } from "../domain/leads";
import { env } from "../env";
import { fromError, fromZod, type ActionState } from "./result";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const schema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(80),
  business: z.string().trim().min(2, "Tell us your business name.").max(120),
  phone: optional(20),
  email: z
    .union([z.literal(""), z.email("Enter a valid email address.").max(160)])
    .optional()
    .transform((v) => v || null),
  city: optional(60),
  vertical: z
    .enum(VERTICALS)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  message: optional(1000),
  // Honeypot: real people never see or fill this field.
  website: z.string().max(0).optional(),
});

export async function bookDemoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    // Bots that fill the honeypot get a success message and nothing is stored.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true, message: THANKS };
    return fromZod(parsed.error);
  }
  const input = { ...parsed.data, website: undefined };

  const h = await headers();
  const ip = h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  try {
    await createLead(db, input, { ipHash: ip ? hashIp(ip, env().SESSION_SECRET) : null });
    return { ok: true, message: THANKS };
  } catch (err) {
    return fromError(err);
  }
}

const THANKS = "Thanks! We'll reach out within one working day to set up a 20-minute walkthrough.";
