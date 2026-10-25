import "server-only";
import { z } from "zod";

/** Treats an empty variable (KEY="") as unset. */
const blank = <T extends z.ZodType>(t: T) => z.preprocess((v) => (v === "" ? undefined : v), t);

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  DEMO_MODE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  /**
   * Message provider for real (non-demo) workspaces: "demo" (simulated) or "whatsapp_cloud".
   * Demo workspaces always use the simulator.
   */
  MESSAGE_PROVIDER: blank(z.enum(["demo", "whatsapp_cloud"]).default("demo")),
  /** Meta WhatsApp Cloud API. See docs/WHATSAPP_SETUP.md. Token and app secret are secrets. */
  WHATSAPP_ACCESS_TOKEN: blank(z.string().min(20).optional()),
  WHATSAPP_PHONE_NUMBER_ID: blank(z.string().regex(/^\d+$/, "WHATSAPP_PHONE_NUMBER_ID is a number").optional()),
  WHATSAPP_TEMPLATE_LANGUAGE: blank(z.string().default("en")),
  WHATSAPP_APP_SECRET: blank(z.string().min(16).optional()),
  WHATSAPP_VERIFY_TOKEN: blank(z.string().min(16).optional()),
  /** Shared secret for the scheduled job endpoint. When unset, the endpoint refuses all calls. */
  CRON_SECRET: z.string().min(16).optional(),
  /**
   * How sign-in links are delivered. "supabase" emails them through Supabase Auth.
   * "dev-insecure" shows the link on screen instead of emailing it, and only works on localhost.
   * Unset means email sign-in is off (the demo login still works).
   */
  AUTH_EMAIL_PROVIDER: blank(z.enum(["supabase", "dev-insecure"]).optional()),
  /** Supabase project URL and publishable (anon) key, used only for sending and verifying sign-in emails. */
  SUPABASE_URL: blank(z.url().optional()),
  SUPABASE_ANON_KEY: blank(z.string().min(20).optional()),
});

export type Env = z.infer<typeof schema>;

function checkProvider(e: Env) {
  if (e.MESSAGE_PROVIDER === "whatsapp_cloud" && (!e.WHATSAPP_ACCESS_TOKEN || !e.WHATSAPP_PHONE_NUMBER_ID)) {
    return "MESSAGE_PROVIDER is whatsapp_cloud, so WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required";
  }
  return null;
}

let cached: Env | undefined;

/** Validated server environment. Throws a readable error on first use if misconfigured. */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}\nSee .env.example.`);
  }
  const problem = checkProvider(parsed.data);
  if (problem) throw new Error(`Invalid environment configuration:\n  - ${problem}\nSee .env.example.`);
  cached = parsed.data;
  return cached;
}
