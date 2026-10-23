"use server";

import { z } from "zod";
import { normalizeEmail } from "../domain/accounts";
import { VERTICAL_OPTIONS, type Vertical } from "../domain/verticals";
import { sendSignInLink } from "../auth/sign-in-links";
import { saveSignupIntent } from "../auth/signup-intent";
import { db } from "../db";
import { enforce, LIMITS } from "../security/rate-limit";
import { keyHash, limitByIp } from "../security/request";
import { fromError, fromZod, type ActionState } from "./result";

/** Adds the dev-only sign-in link, shown on screen when emails aren't being sent. */
export type SignInState = ActionState & { devLink?: string; email?: string };

const TOO_MANY = "Too many sign-in requests. Please wait a few minutes and try again.";

const email = z.email("Enter a valid email address.").max(160).transform(normalizeEmail);

export async function requestSignInAction(_prev: SignInState, form: FormData): Promise<SignInState> {
  const parsed = z.object({ email }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await limitByIp("sign-in", LIMITS.signInPerIp, TOO_MANY);
    await enforce(db, `sign-in:email:${keyHash(parsed.data.email)}`, LIMITS.signInPerEmail, TOO_MANY);
    const delivery = await sendSignInLink(parsed.data.email);
    return {
      ok: true,
      email: parsed.data.email,
      message: `We sent a sign-in link to ${parsed.data.email}. It works for one hour, on this device.`,
      devLink: delivery.kind === "shown" ? delivery.url : undefined,
    };
  } catch (err) {
    return fromError(err);
  }
}

const signupSchema = z.object({
  ownerName: z.string().trim().min(2, "Tell us your name.").max(80),
  businessName: z.string().trim().min(2, "Tell us your business name.").max(120),
  city: z.string().trim().max(60).optional().default(""),
  vertical: z.enum(VERTICAL_OPTIONS.map((v) => v.value) as [string, ...string[]], { error: "Pick the closest match." }),
  email,
  // Honeypot: real people never see or fill this field.
  website: z.string().max(0).optional(),
});

/**
 * Saves the business details in a signed cookie and emails a sign-in link. The business is created only
 * when the link is clicked, so nobody can create an account for an email they don't control. The reply is
 * the same whether or not the email already has an account.
 */
export async function signUpAction(_prev: SignInState, form: FormData): Promise<SignInState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fromZod(parsed.error);
  if (parsed.data.website) return { ok: true, message: "Check your email for a link to finish setting up." };
  try {
    await limitByIp("sign-up", LIMITS.signUpPerIp, "Too many sign-ups from this connection. Please try again later.");
    await enforce(db, `sign-in:email:${keyHash(parsed.data.email)}`, LIMITS.signInPerEmail, TOO_MANY);
    const data = parsed.data;
    await saveSignupIntent({
      email: data.email,
      ownerName: data.ownerName,
      businessName: data.businessName,
      city: data.city,
      vertical: data.vertical as Vertical,
    });
    const delivery = await sendSignInLink(data.email);
    return {
      ok: true,
      email: data.email,
      message: `We sent a link to ${data.email}. Open it on this device to finish setting up ${data.businessName}.`,
      devLink: delivery.kind === "shown" ? delivery.url : undefined,
    };
  } catch (err) {
    return fromError(err);
  }
}
