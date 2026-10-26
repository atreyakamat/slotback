# Hosting the demo app (slotback-demo)

The full app runs on its own Netlify site, `slotback-demo`, built from the **`demo-app`** branch. The landing page (`slotback-805m`) is separate and builds from `main`.

## Why a separate branch

Both sites live in one repo and each needs its own root `netlify.toml`. `main` points at the landing page in `site/` (`docs/netlify.landing.toml` is a copy). `demo-app` has the app's config at the root. When the app changes on `main`, merge `main` into `demo-app` and keep `netlify.toml` as the app's.

## One-time setup

1. Supabase: create a project in the SlotBack org, region Mumbai. Open **Connect** and copy two strings:
   - **Session pooler** (port 5432) → `DIRECT_URL`. Use this one, not the "Direct connection": that host is IPv6-only and Netlify's build can't reach it.
   - **Transaction pooler** (port 6543) → `DATABASE_URL`. Add `?pgbouncer=true` at the end.
2. Netlify `slotback-demo` → **Link repository** → `atreyakamat/slotback`, **production branch `demo-app`**, base directory empty.
3. Environment variables (already set: `NEXT_PUBLIC_APP_URL`, `DEMO_MODE=true`, `MESSAGE_PROVIDER=demo`). Add, marked secret:
   - `DATABASE_URL`, `DIRECT_URL`
   - `SESSION_SECRET` = `openssl rand -base64 32`
   - `CRON_SECRET` = `openssl rand -base64 24`
4. Deploys → **Trigger deploy**. Open `/api/health` (expect `{"status":"ok"}`), then `/login` → **Try the demo workspace**.

## Database SQL

None to paste. The production build runs `prisma migrate deploy`, which creates every table and the row-level-security rules from `prisma/migrations`. Pasting those files into the SQL editor by hand would make the next deploy fail with "already exists". The demo salon is created on the first demo login.
