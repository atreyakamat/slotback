import { z } from "zod";
import { DomainError } from "../domain/errors";

/** Shape returned by every form action, consumed with useActionState. */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};


export function fromZod(error: z.ZodError): ActionState {
  return { ok: false, message: "Please check the highlighted fields.", fieldErrors: z.flattenError(error).fieldErrors };
}

/** Turns expected domain failures into a message; rethrows anything unexpected (redirects included). */
export function fromError(err: unknown): ActionState {
  if (err instanceof DomainError) return { ok: false, message: err.message };
  throw err;
}
