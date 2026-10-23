"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton, TextInput } from "@/components/ui/form";
import { requestSignInAction, type SignInState } from "@/server/actions/accounts";
import { CheckEmail } from "./check-email";

const idle: SignInState = { ok: false };

export function SignInForm() {
  const [attempt, setAttempt] = useState(0);
  return <Inner key={attempt} onRetry={() => setAttempt((a) => a + 1)} />;
}

function Inner({ onRetry }: { onRetry: () => void }) {
  const [state, action] = useActionState(requestSignInAction, idle);
  if (state.ok) return <CheckEmail message={state.message} devLink={state.devLink} onRetry={onRetry} />;
  const error = state.fieldErrors?.email;
  return (
    <form action={action} className="grid gap-4" noValidate>
      <Field label="Work email" htmlFor="signin-email" error={error}>
        <TextInput
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@yourbusiness.in"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "signin-email-error" : undefined}
        />
      </Field>
      {state.message && !state.fieldErrors ? <FormMessage state={state} /> : null}
      <SubmitButton size="lg" className="w-full" pendingLabel="Sending link…">
        Email me a sign-in link
      </SubmitButton>
    </form>
  );
}
