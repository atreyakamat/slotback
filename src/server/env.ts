import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  DEMO_MODE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  /** Shared secret the scheduled delivery job sends as a Bearer token. Unset disables the endpoint. */
  CRON_SECRET: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().min(32, "CRON_SECRET must be at least 32 characters").optional(),
  ),
  /** WhatsApp provider adapter. Only "mock" exists: it records messages without sending them. */
  WHATSAPP_PROVIDER: z.enum(["mock"]).default("mock"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Validated server environment. Throws a readable error on first use if misconfigured. */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}\nSee .env.example.`);
  }
  cached = parsed.data;
  return cached;
}
