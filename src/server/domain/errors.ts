/** An expected, user-facing failure. `message` is safe to show to staff. */
export class DomainError extends Error {
  constructor(
    public readonly code:
      | "not_found"
      | "invalid"
      | "conflict"
      | "forbidden"
      | "invalid_transition"
      | "rate_limited",
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

/** True when Postgres rejected a write because of the given named constraint. */
export function violatesConstraint(err: unknown, constraint: string): boolean {
  if (!err || typeof err !== "object") return false;
  const text = `${(err as { message?: string }).message ?? ""} ${JSON.stringify((err as { meta?: unknown }).meta ?? {})}`;
  return text.includes(constraint);
}

/** True for a unique-constraint violation (Prisma P2002). */
export function isUniqueViolation(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && (err as { code?: string }).code === "P2002");
}
