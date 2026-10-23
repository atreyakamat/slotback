# Deployment

SlotBack runs as one Next.js app on Netlify with Postgres on Supabase. Everything below fits the free tiers.

## 1. Supabase (database)

1. Create a project at supabase.com. Region: **Mumbai (ap-south-1)**. Save the database password in your password manager.
2. Open **Connect** and copy two connection strings:
   - **Transaction pooler** (port 6543): this is `DATABASE_URL`.
   - **Session pooler** or **Direct connection** (port 5432): this is `DIRECT_URL`. Migrations use it.

SlotBack uses Supabase as plain Postgres for now. No Supabase API keys are needed yet.

## 2. Netlify (hosting)

1. **Add new site → Import an existing project →** pick the `slotback` GitHub repo. Netlify reads `netlify.toml`.
2. **Site configuration → Environment variables**, add:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase transaction pooler string |
| `DIRECT_URL` | Supabase session/direct string |
| `SESSION_SECRET` | Output of `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Your Netlify URL, e.g. `https://slotback.netlify.app` |
| `DEMO_MODE` | `true` |

3. Trigger a deploy. Production deploys run `prisma migrate deploy` before building, so the schema is created on the first deploy.
4. Open `/api/health`. It should return `{"status":"ok"}`.
5. Open `/login` and click **Try the demo workspace**. The demo salon is created on first use.

## Deploy previews

Every pull request gets a preview URL. Previews build against the same environment variables but **never run migrations**. A PR that changes the schema must be merged (or its migration applied deliberately) before its preview works against the shared database.

## Rolling back

Use **Deploys → (previous deploy) → Publish deploy** in Netlify. Migrations are additive by convention; a destructive migration requires a written rollback plan in its PR.
