import type { ActionState } from "./result";

/** Initial state for useActionState; safe to import from client components. */
export const idle: ActionState = { ok: false };
