# SlotBack

**Make every opening count.** SlotBack refills last-minute cancellations for appointment businesses. When a slot opens up, opted-in waitlist customers get a secure, expiring link; the first to claim it gets the appointment; the owner sees the revenue recovered.

India-first, piloting in Goa. Product scope lives in the PRD; this repository is the demo-ready MVP.

## What's in the app

- **Landing page** (`/`) with a Book-a-demo form, FAQ and privacy page
- **Today**: recovered revenue for the last 30 days, fill rate, latest recoveries, today's bookings by staff member
- **Schedule**: day grid and week list; book, move, complete, mark no-show, cancel
- **Recovery**: cancel and refill, ranked audience with reasons, message preview, batched offers, live status
- **Claim page** (`/c/…`): what a customer sees from WhatsApp/SMS, first to confirm wins
- **Waitlist**: per-channel consent, preferred days and times
- **Analytics**: recovered vs completed revenue, daily chart, funnel, CSV export
- **Settings**: business rules (lead time, offer window, quiet hours), services, staff, activity log, demo reset

To present it, follow [docs/DEMO_RUNBOOK.md](docs/DEMO_RUNBOOK.md).

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router, Cache Components) + TypeScript |
| UI | Tailwind CSS 4, Motion, lucide icons, PRD design tokens, light/dark/system theme |
| Data | PostgreSQL (Supabase in production) via Prisma 7 + `@prisma/adapter-pg` |
| Auth | Signed, HTTP-only session cookie (jose) + data access layer; one-click demo login |
| Tests | Vitest (unit + real-Postgres integration), Playwright (end-to-end) |
| CI / hosting | GitHub Actions, Netlify |

## Getting started

Requirements: Node 22+, pnpm 10, Postgres 15+ (local install or `docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`).

```bash
pnpm install
cp .env.example .env          # then fill in SESSION_SECRET (openssl rand -base64 32)
pnpm db:migrate               # create the schema
pnpm db:seed                  # create the fictional demo salon
pnpm dev                      # http://localhost:3000 → "Try the demo workspace"
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` / `pnpm typecheck` | ESLint and TypeScript |
| `pnpm test` | Unit tests, plus database tests when `TEST_DATABASE_URL` is set |
| `pnpm test:e2e` | Playwright against a production build (run `pnpm build` first) |
| `pnpm db:migrate` | Create/apply migrations in development |
| `pnpm db:deploy` | Apply migrations (production, CI) |
| `pnpm db:seed` | Reset the demo workspace. Never touches real organizations |

Database tests need their own database, e.g. `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/slotback_test pnpm test`.

## Project layout

```
prisma/              schema, migrations, seed entry
src/app/             routes: landing (/), /login, staff console (/app/*), /api/*
src/components/      UI primitives, theme, app shell
src/server/          server-only code: env, db, auth (session + DAL), domain rules, messaging, actions, queries, demo seed
netlify/functions/   scheduled job (every minute): expiry and message delivery
src/lib/             shared pure helpers (time zones, money)
tests/               Vitest unit and integration tests
e2e/                 Playwright tests
docs/                deployment and engineering notes
```

## Integrity guarantees

These are enforced by the database, not only the UI:

- **No double booking per staff member.** A Postgres exclusion constraint rejects overlapping non-cancelled appointments on the same resource.
- **One winner per opening.** `claims.campaign_id` is unique, so a slot can be claimed by at most one customer even under concurrent requests.
- **Claim tokens are never stored.** Only their SHA-256 hash is kept.
- **Consent is per channel.** A revoked channel suppresses outreach on that channel.
- **Tenant isolation.** Every query is scoped through the data access layer (`src/server/auth/dal.ts`), using ids from the verified session only.

## Demo data

The demo workspace is a fictional salon, "Casa Verde Salon" in Panaji, with a month of bookings and recovery history so the dashboard opens with believable numbers (around a 50% fill rate). All names are invented and all phone numbers are in the reserved `+91 90000 000xx` range. Demo workspaces always use the simulated message provider, so nothing reaches a real phone. Owners can reset it from **Settings**.

## Known limits (by design, for now)

- Messaging is simulated. A real WhatsApp/SMS provider needs an account, templates and a spend decision.
- Sign-in is the one-click demo login. Email sign-in for real businesses comes with the first pilot.
- Claim links rely on 256-bit unguessable tokens; there is no per-IP rate limit on the claim page yet.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
