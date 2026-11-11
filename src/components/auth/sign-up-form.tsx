"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, Select, SubmitButton, TextInput } from "@/components/ui/form";
import { signUpAction, type SignInState } from "@/server/actions/accounts";
import { VERTICAL_OPTIONS } from "@/server/domain/verticals";
import { CheckEmail } from "./check-email";

const idle: SignInState = { ok: false };

export function SignUpForm() {
  const [attempt, setAttempt] = useState(0);
  return <Inner key={attempt} onRetry={() => setAttempt((a) => a + 1)} />;
}

function Inner({ onRetry }: { onRetry: () => void }) {
  const [state, action] = useActionState(signUpAction, idle);
  if (state.ok) return <CheckEmail message={state.message} devLink={state.devLink} onRetry={onRetry} />;
  const err = (k: string) => state.fieldErrors?.[k];
  const invalid = (k: string) => (err(k) ? { "aria-invalid": true, "aria-describedby": `signup-${k}-error` } : {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="signup-ownerName" error={err("ownerName")}>
          <TextInput id="signup-ownerName" name="ownerName" autoComplete="name" required {...invalid("ownerName")} />
        </Field>
        <Field label="Business name" htmlFor="signup-businessName" error={err("businessName")}>
          <TextInput id="signup-businessName" name="businessName" autoComplete="organization" required {...invalid("businessName")} />
        </Field>
        <Field label="Type of business" htmlFor="signup-vertical" error={err("vertical")}>
          <Select id="signup-vertical" name="vertical" defaultValue="" required {...invalid("vertical")}>
            <option value="" disabled>
              Choose one
            </option>
            {VERTICAL_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="City" htmlFor="signup-city" error={err("city")}>
          <TextInput id="signup-city" name="city" autoComplete="address-level2" placeholder="Panaji" {...invalid("city")} />
        </Field>
      </div>
      <Field label="Work email" htmlFor="signup-email" error={err("email")} hint="We'll send a link to confirm it. No password needed.">
        <TextInput id="signup-email" name="email" type="email" inputMode="email" autoComplete="email" required {...invalid("email")} />
      </Field>
      <div className="hidden" aria-hidden>
        <label htmlFor="signup-website">Website</label>
        <input id="signup-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.message ? <FormMessage state={state} /> : null}
      <SubmitButton size="lg" className="w-full" pendingLabel="Sending link…">
        Create my account
      </SubmitButton>
    </form>
  );
}
