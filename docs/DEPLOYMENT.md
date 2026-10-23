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
| `CRON_SECRET` | Output of `openssl rand -base64 24`. Lets the every-minute job expire offers and send queued messages |
| `MESSAGE_PROVIDER` | `demo` (simulated; nothing is sent to real phones until a provider is approved) |

3. Trigger a deploy. Production deploys run `prisma migrate deploy` before building, so the schema is created on the first deploy.
4. Open `/api/health`. It should return `{"status":"ok"}`.
5. Open `/login` and click **Try the demo workspace**. The demo salon is created on first use.
6. **Logs → Functions → `tick`** should show a run every minute with no warnings. If it says `CRON_SECRET not set`, add the variable and redeploy.

## Go-live checklist

- [ ] `/api/health` returns ok on the production URL
- [ ] `NEXT_PUBLIC_APP_URL` matches the production URL exactly (claim links and QR codes use it)
- [ ] Demo login works and **Settings → Reset demo data** recreates the salon
- [ ] Run the recovery loop once end to end (see [DEMO_RUNBOOK.md](DEMO_RUNBOOK.md)), including a claim from a real phone via the QR code
- [ ] The `tick` function runs every minute
- [ ] Submit the **Book a demo** form on the landing page and confirm the row appears in Supabase → Table editor → `leads`
- [ ] Custom domain (optional) added in Netlify, then `NEXT_PUBLIC_APP_URL` updated and redeployed

## Where things live

- **Demo requests:** Supabase → Table editor → `leads`. Submitters' IPs are never stored, only a keyed hash used for rate limiting (5 per hour).
- **Audit trail:** in the app under **Settings → Activity**, or the `audit_events` table.

## Deploy previews

Every pull request gets a preview URL. Previews build against the same environment variables but **never run migrations**. A PR that changes the schema must be merged (or its migration applied deliberately) before its preview works against the shared database.

## Rolling back

Use **Deploys → (previous deploy) → Publish deploy** in Netlify. Migrations are additive by convention; a destructive migration requires a written rollback plan in its PR.
