<div align="center">

<img src="apps/web/public/assets/app_logo.png" alt="Zlo" width="88" />

# Zlo

**Know exactly what your subscriptions cost — every month, every renewal.**

Track recurring subscriptions, normalise spending across billing cycles, see upcoming
renewals before they hit, and get reminders. A personal subscription tracker SaaS built
as a type-safe TypeScript monorepo.

[Next.js](https://nextjs.org) · [tRPC](https://trpc.io) · [Drizzle ORM](https://orm.drizzle.team) ·
[Better Auth](https://better-auth.com) · [Postgres](https://www.postgresql.org) · [Turborepo](https://turbo.build)

![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![tRPC](https://img.shields.io/badge/tRPC-11-398CCB?logo=trpc&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?logo=drizzle&logoColor=black)
![Postgres](https://img.shields.io/badge/Postgres-Neon-4169E1?logo=postgresql&logoColor=white)
![Better Auth](https://img.shields.io/badge/Better_Auth-1.6-111827)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.3-FBF0DF?logo=bun&logoColor=black)
![Status](https://img.shields.io/badge/status-active_development-F59E0B)

</div>

---

## Overview

Zlo turns a messy list of recurring charges into one clear picture of your spending.
You add the subscriptions you already pay for elsewhere — Zlo records them, normalises
them to a monthly cost, and tells you what is renewing next.

It is a **tracker, not a payment processor**: Zlo never charges you for external
subscriptions and does not read bank transactions. Every number on screen comes from
your own database records.

### What you can do today

- **Full subscription CRUD** — create, list, inspect, update, delete, cancel, pause, and
  resume subscriptions, with validation on every write.
- **Accurate cost normalisation** — weekly / monthly / yearly cycles with an
  interval-count model (e.g. "every 3 months") normalised to monthly and annual costs.
- **Multi-currency without mixing** — amounts are stored as integer minor units and
  totals are always grouped per currency, because there is no exchange-rate policy.
- **Dashboard with real data** — active count, monthly and annual recurring cost,
  upcoming renewals, recently added subscriptions, category breakdown.
- **Forward-looking analytics** — a 12-month projection built from real billing cycles,
  clearly labelled as recurring-cost estimates, not historical payments.
- **Renewal reminders (domain layer)** — reminder records, dedupe keys, pending / sent /
  failed states, cancellation on delete or cancel.
- **Renewal calendar** — a month grid on `/renewals` that projects real billing cycles
  (weekly / monthly / yearly), shows each subscription's logo on the days it charges, and
  keeps the view, month, selected day and window in the URL so the flow survives reloads.
- **SEO foundations** — unique per-page metadata, Open Graph and Twitter cards with a
  generated `opengraph-image`, `robots.txt` with a sitemap directive, a sitemap of the
  public routes, and schema.org JSON-LD (Organization / WebSite / WebApplication).
- **Authentication** — Better Auth with Google sign-in, session-based protected routes,
  and ownership enforced on every procedure.
- **Polished UI** — shadcn-style components, responsive layout, dark mode, loading
  skeletons, empty states, and keyboard-accessible controls.

### Project status

Zlo is under active development. The authentication, database schema, tRPC API, dashboard,
subscriptions UI, renewal calendar, public landing page, and SEO metadata are functional.
Remaining work is listed in the [Roadmap](#roadmap): email delivery for reminders and
broader automated test coverage.

---

## Features in detail

| Area | Highlights |
| --- | --- |
| Subscriptions | Create / read / update / delete / cancel / pause / resume, 10 categories, trial end dates, notes, provider and logo picker |
| Billing model | `week` / `month` / `year` + `intervalCount` for quarterly and other cycles; dates stored as plain `YYYY-MM-DD` |
| Money | Integer minor units (`₹499.00 → 49900`), ISO currency codes enforced by a DB check constraint, no floating-point money |
| Dashboard | Active subscription count, monthly + annual recurring cost per currency, next-30-days renewals and charge total |
| Renewal calendar | Month grid projecting real billing cycles, per-subscription logos on charge days, URL-persisted month / day / view |
| SEO | `generateMetadata`-style metadata with template titles, OG + Twitter cards with a generated 1200×630 image, `robots.txt`, `sitemap.xml`, JSON-LD |
| Analytics | 12-month projection per calendar month, category breakdown with percentages, currency-aware totals |
| Reminders | Per-user reminder preferences, scheduled reminder records, `dedupeKey` to prevent duplicate delivery, retry/status tracking |
| Security | Server-side session checks, ownership filters in every query, Zod validation on all input, no client-supplied user IDs |

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Monorepo | Bun workspaces + Turborepo, dependency catalog |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn-style UI on Radix / Base UI |
| Data fetching | tRPC 11 with TanStack React Query and a typed `AppRouter` |
| API | tRPC routers (`subscription`, `dashboard`, `reminder`, `reminderPreference`, `analytics`) |
| Validation | Zod schemas shared through `@Zlo/zod` |
| Database | PostgreSQL on Neon, Drizzle ORM + drizzle-kit |
| Auth | Better Auth with the Drizzle adapter and Google OAuth |
| Testing | Vitest (unit tests for billing math, formatting, and metrics) |

---

## Repository layout

```
Zlo/
├── apps/
│   └── web/                  # Next.js frontend (App Router, Tailwind, shadcn-style UI)
├── packages/
│   ├── api/                  # tRPC routers, context, procedures, services
│   ├── auth/                 # Better Auth instance and configuration
│   ├── db/                   # Drizzle schema, client, migrations
│   ├── env/                  # Typed environment validation (Zod)
│   ├── zod/                  # Shared Zod schemas and billing calculations
│   └── config/               # Shared tsconfig base
├── turbo.json                # Turborepo pipeline
├── bts.jsonc                 # Better Fullstack stack graph
├── AI_MEMORY.md              # Cross-session AI working memory
└── TASK.md                   # Product spec and working rules
```

Application routes: `/login`, `/dashboard`, `/subscriptions`, `/renewals` (renewal
calendar), `/analytics`, `/settings`, `/calendar` (placeholder), plus the generated
`/robots.txt`, `/sitemap.xml` and `/opengraph-image`.

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh) 1.3.14 or newer (`packageManager` is pinned in the root manifest)
- A PostgreSQL database — [Neon](https://neon.tech) works out of the box
- A Google OAuth client (for sign-in)

### Install

```sh
bun install
```

### Configure environment

Create `.env` files for the server and the web app. The variables below are validated
by `packages/env` at startup, so a missing or malformed value fails fast instead of
surfacing as a runtime error later.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth secret, at least 32 characters |
| `BETTER_AUTH_URL` | Public base URL of the app, e.g. `http://localhost:3000` |
| `CORS_ORIGIN` | Allowed origin for API requests |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NODE_ENV` | `development` \| `production` \| `test` |

> Never commit `.env` files. `.env` and `.env*.local` are gitignored.

### Push the schema and run

```sh
bun db:push      # apply the Drizzle schema to your database
bun dev          # start the web app and services (Turborepo)
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

---

## Commands

| Command | Description |
| --- | --- |
| `bun install` | Install workspace dependencies |
| `bun dev` | Run all apps in development mode |
| `bun dev:web` | Run only the web app |
| `bun build` | Production build |
| `bun check-types` | Type-check every workspace |
| `bun test` | Run the API test suite |
| `bun run --filter web test` | Run the web test suite |
| `bun db:push` | Push the Drizzle schema to the database |
| `bun db:generate` | Generate a migration from schema changes |
| `bun db:migrate` | Apply generated migrations |
| `bun db:studio` | Open Drizzle Studio |

---

## How the billing math works

Costs are normalised at presentation time from real billing cycles, using integer minor
units so money never touches floating-point arithmetic:

| Billing cycle | Monthly equivalent |
| --- | --- |
| Every `n` weeks | `amount × 52 ÷ (12 × n)` |
| Every `n` months | `amount ÷ n` |
| Every `n` years | `amount ÷ (12 × n)` |

`annual = monthly × 12`. Rounding happens only when a value is displayed, never in the
aggregations behind it. These figures are **normalised recurring-cost estimates** — an
upcoming renewal date is not a completed payment, and cancelled or expired
subscriptions never count as active recurring cost.

The projection helpers live in `apps/web/src/lib/subscription-metrics.ts` with the
shared formulas in `packages/zod/src/calculations`, covered by unit tests.

---

## Testing

```sh
bun test                    # @Zlo/api suite
bun run --filter web test   # web suite (billing math, formatting, metrics)
```

Areas under test include interval normalisation, currency handling, upcoming-renewal
filtering, status transitions, and dashboard projections.

---

## Roadmap

- [x] Public landing page with product-accurate copy and working routes
- [x] Renewal calendar view
- [x] SEO metadata, Open Graph image, robots.txt, sitemap, JSON-LD
- [x] Deployment configuration (Vercel services mode, single `web` service)
- [ ] Email delivery for renewal reminders (provider selection + scheduler wiring)
- [ ] Broader automated coverage: cross-user access, validation failures, reminder dedupe

---

## Acknowledgments

Generated with [Better Fullstack](https://github.com/Marve10s/Better-Fullstack) and
extended into a subscription tracker. Built on the open-source projects listed above.

## License

No license has been selected yet — all rights reserved until one is added.
