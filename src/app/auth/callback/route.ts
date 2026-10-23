import { redirect } from "next/navigation";
import { createSession } from "@/server/auth/session";
import { verifySignInCallback } from "@/server/auth/sign-in-links";
import { clearSignupIntent, readSignupIntent } from "@/server/auth/signup-intent";
import { db } from "@/server/db";
import { createBusiness, findSignIn, normalizeEmail } from "@/server/domain/accounts";
import { DomainError } from "@/server/domain/errors";

/** Where sign-in links land: verify the email, create the business on first sign-up, then start a session. */
export async function GET(request: Request) {
  const email = await verifySignInCallback(new URL(request.url));
  if (!email) redirect("/login?error=link");

  const intent = await readSignupIntent();
  if (intent && normalizeEmail(intent.email) === normalizeEmail(email)) {
    await clearSignupIntent();
    try {
      await createBusiness(db, { ...intent, email });
    } catch (err) {
      // Already has an account: fall through and sign them in to it.
      if (!(err instanceof DomainError && err.code === "conflict")) throw err;
    }
  }

  const found = await findSignIn(db, email);
  if (!found) redirect("/signup?error=no-account");
  await createSession(found.session);
  redirect(found.onboarded ? "/app" : "/onboarding");
}
