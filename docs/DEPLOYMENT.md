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
| `CRON_SECRET` | Output of `openssl rand -base64 32`. Turns on scheduled message delivery |
| `WHATSAPP_PROVIDER` | `mock` (the only option today: messages are recorded, never sent) |

3. Trigger a deploy. Production deploys run `prisma migrate deploy` before building, so the schema is created on the first deploy.
4. Open `/api/health`. It should return `{"status":"ok"}`.
5. Open `/login` and click **Try the demo workspace** (salon) or **Try the dental clinic demo**. Both demos are created on first use.

## Appointment reminders

Booking confirmations and reminders are written to the `outbox_messages` table when a patient books, and delivered by a worker:

- `netlify/functions/deliver-outbox.mts` is a Netlify scheduled function that runs every 5 minutes. It calls `POST /api/cron/deliver` with `Authorization: Bearer $CRON_SECRET`.
- Scheduled functions only run on the **published production deploy**, not previews.
- Without `CRON_SECRET` the endpoint returns 503 and nothing is sent automatically. Owners can still press **Send due messages** on the Messages page.
- With `WHATSAPP_PROVIDER=mock`, delivery marks messages as sent without contacting anyone. Connecting a real WhatsApp provider (and its approved message templates) is a separate, paid step.

## Deploy previews

Every pull request gets a preview URL. Previews build against the same environment variables but **never run migrations**. A PR that changes the schema must be merged (or its migration applied deliberately) before its preview works against the shared database.

## Rolling back

Use **Deploys → (previous deploy) → Publish deploy** in Netlify. Migrations are additive by convention; a destructive migration requires a written rollback plan in its PR.
