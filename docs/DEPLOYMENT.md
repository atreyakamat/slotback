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
| `NEXT_PUBLIC_APP_URL` | `https://slotback.atreyakamat.dev` (no trailing slash) |
| `DEMO_MODE` | `true` |
| `CRON_SECRET` | Output of `openssl rand -base64 24`. Lets the every-minute job expire offers and send queued messages |
| `MESSAGE_PROVIDER` | `demo` (simulated; nothing is sent to real phones until a provider is approved) |
| `AUTH_EMAIL_PROVIDER` | `supabase` (emails sign-in links for real businesses). Never `dev-insecure` here |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API → publishable (anon) key. Never the service role key |

3. Trigger a deploy. Production deploys run `prisma migrate deploy` before building, so the schema is created on the first deploy.
4. Open `/api/health`. It should return `{"status":"ok"}`.
5. Open `/login` and click **Try the demo workspace**. The demo salon is created on first use.
6. **Logs → Functions → `tick`** should show a run every minute with no warnings. If it says `CRON_SECRET not set`, add the variable and redeploy.

### Email sign-in (Supabase Auth)

Businesses sign up and sign in with a link emailed through Supabase Auth. SlotBack only uses Supabase to send and check those links; it keeps its own session.

1. Supabase → **Authentication → URL Configuration**: set **Site URL** to your `NEXT_PUBLIC_APP_URL`, and add `https://<your-site>.netlify.app/auth/callback` and `https://slotback.atreyakamat.dev/auth/callback` to **Redirect URLs**.
2. Supabase → **Authentication → Providers → Email**: keep it enabled. Passwords aren't used.
3. Supabase's built-in email sender has a small hourly limit meant for testing. Before inviting real businesses, add a custom SMTP sender under **Authentication → Emails → SMTP settings** (a paid or free-tier email service; needs approval).
4. The link must be opened in the same browser that asked for it. Test it: sign up at `/signup` with your own email, click the link, and finish the setup steps.

## Go-live checklist

- [ ] `/api/health` returns ok on the production URL
- [ ] `NEXT_PUBLIC_APP_URL` matches the production URL exactly (claim links and QR codes use it)
- [ ] Demo login works and **Settings → Reset demo data** recreates the salon
- [ ] Run the recovery loop once end to end (see [DEMO_RUNBOOK.md](DEMO_RUNBOOK.md)), including a claim from a real phone via the QR code
- [ ] The `tick` function runs every minute
- [ ] Submit the **Book a demo** form on the landing page and confirm the row appears in Supabase → Table editor → `leads`
- [ ] `slotback.atreyakamat.dev` is the primary domain with a valid certificate (section 3)

## Where things live

- **Demo requests:** Supabase → Table editor → `leads`. Submitters' IPs are never stored, only a keyed hash used for rate limiting (5 per hour).
- **Audit trail:** in the app under **Settings → Activity**, or the `audit_events` table.

## 3. Custom domain: slotback.atreyakamat.dev

1. Netlify: **Domain management → Add a domain → `slotback.atreyakamat.dev`**. Netlify will say it's an external domain and show the target, e.g. `<your-site>.netlify.app`.
2. At the DNS provider for `atreyakamat.dev`, add one record:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| CNAME | `slotback` | `<your-site>.netlify.app` | Auto / 3600 |

   If the domain is behind Cloudflare, set the record to **DNS only** (grey cloud) so Netlify can issue the certificate.
3. Back in Netlify, wait for **HTTPS → Certificate** to show as provisioned (usually a few minutes; `.dev` domains are HTTPS-only, so the site won't load before this).
4. Make `slotback.atreyakamat.dev` the **primary domain**, so the `.netlify.app` address redirects to it.
5. Confirm `NEXT_PUBLIC_APP_URL=https://slotback.atreyakamat.dev`, then **Deploys → Trigger deploy → Clear cache and deploy site**. Claim links, QR codes, canonical URLs, social previews, `robots.txt` and `sitemap.xml` all use this value at build time.
6. Check: `https://slotback.atreyakamat.dev/api/health` returns ok, and a fresh claim link in the demo starts with `https://slotback.atreyakamat.dev/c/`.

## Deploy previews

Every pull request gets a preview URL. Previews build against the same environment variables but **never run migrations**. A PR that changes the schema must be merged (or its migration applied deliberately) before its preview works against the shared database.

## Rolling back

Use **Deploys → (previous deploy) → Publish deploy** in Netlify. Migrations are additive by convention; a destructive migration requires a written rollback plan in its PR.
