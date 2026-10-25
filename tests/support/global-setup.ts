import { execSync } from "node:child_process";

/**
 * Applies pending migrations to the test database once per run (non-destructive).
 * Tests create and delete their own rows. Skipped when no test database is configured.
 */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    console.warn("TEST_DATABASE_URL is not set: database integration tests will be skipped.");
    return;
  }
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}
