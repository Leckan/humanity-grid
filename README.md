# Humanity Grid

Humanity Grid is a local-first MVP for discovering community initiatives and coordinating skills, volunteer applications, resource offers, private assistance requests, and initiative review.

The repository was empty when implementation began. This MVP uses Next.js App Router, React, TypeScript, and Node's built-in SQLite module so it can run without a hosted database or paid service. It is an evaluation build, not a production humanitarian or payment platform.

## Current capabilities

- Responsive public home, discovery, cause, organization, initiative detail, and how-it-works pages.
- Shareable query-based discovery filters for keyword, cause, contribution type, location, and remote/in-person opportunities.
- Local registration and sign-in with salted scrypt password hashes and signed, HTTP-only session cookies.
- Role-gated organizer and reviewer workspaces. A user cannot grant themselves the reviewer or admin role through registration.
- Initiative draft creation, owner-only submission, reviewer decisions, and audit records.
- Persisted skill applications and in-kind offers. Organizers can accept or decline these on their own initiatives.
- Private assistance-request submission and requester status view. Reviewer details are restricted server-side to reviewer/admin roles.
- Saved initiatives and account dashboards.
- Deterministic matching helper with domain unit tests.
- Repeatable local seeding of synthetic causes, organizations, and initiatives.
- Brand name, tagline, and primary color can be configured via environment variables.

Every seeded organization and initiative is synthetic, clearly labeled in the UI, and not verified. Aggregate impact values are not claimed. Paid donation records are empty; financial giving is disabled.

## Requirements

- Node.js 22.13 or later (uses the built-in `node:sqlite` API).
- npm 10 or later.

## Local setup

```bash
cp .env.example .env.local
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). SQLite data is created at `./data/humanity-grid.sqlite` by default. Set `DATABASE_PATH` to change the location. The seed command is repeatable and only creates sample projects when the tables are empty.

For local review workflows, create an administrator account by setting `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (12 or more characters) in the shell before running `npm run db:seed`. The seeded account is not created unless both values are set. User registration only creates contributor or organizer roles.

For production, set `SESSION_SECRET` to at least 32 random characters. The local fallback secret is rejected in production. Do not expose `.env.local` or the SQLite database.

## Commands

```bash
npm run dev         # local development server
npm run db:seed     # seed synthetic sample data; optionally seed a local admin
npm run typecheck   # TypeScript check
npm test            # built-in Node test runner (domain rules)
npm run build       # production build
npm start           # serve the production build
```

`npm install` resolves the pinned direct dependency versions in `package.json`. This environment used locally available dependencies because the package registry was unreachable during implementation; no dependency credentials or private packages are required.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_PATH` | SQLite file path; defaults to `./data/humanity-grid.sqlite`. |
| `SESSION_SECRET` | HMAC secret for sessions; required and validated in production. |
| `NEXT_PUBLIC_APP_NAME` | Configurable product name. |
| `NEXT_PUBLIC_APP_TAGLINE` | Configurable tagline. |
| `NEXT_PUBLIC_BRAND_COLOR` | Hex primary accent color, e.g. `#137f68`. |
| `SEED_ADMIN_EMAIL` | Optional email for a local administrator seeded by `db:seed`. |
| `SEED_ADMIN_PASSWORD` | Optional local admin password (minimum 12 characters). |
| `STRIPE_SECRET_KEY` | Reserved for a future Stripe integration; unused in this MVP. |
| `STRIPE_WEBHOOK_SECRET` | Reserved for validated Stripe webhook handling; unused in this MVP. |
| `STRIPE_CONNECT_CLIENT_ID` | Reserved for recipient onboarding; unused in this MVP. |

## Payment and trust boundaries

Financial contributions are disabled. The detail page explains why and disables the donate control. Funding targets on synthetic initiatives are illustrative only; no payment session, donation, payout, refund, receipt, tax deduction, or verified impact is claimed. Before enabling financial giving, decide and document the recipient/funds-flow model, complete recipient onboarding, add a provider adapter and idempotent signed-webhook handling, and complete jurisdiction-specific legal/compliance review.

Organization identity, initiative review, user identity, and project completion are distinct checks. Sample records are unverified. Reviewer approval is recorded as an initiative review only; it does not assert a nonprofit status or confirm project outcomes.

## Data and privacy

The local database includes users, causes, organizations, initiatives, milestones, saved initiatives, financial-record placeholders, volunteer applications, resource offers, private assistance requests, and audit logs. Schema creation runs idempotently on first database access; sample seeding can be rerun safely.

Assistance requests are private by default and cannot be made public through the current workflow. Their details are available only to the requester and reviewer/admin roles. This MVP does not include private file storage, secure document uploads, deletion/export tooling, or a production retention policy. Do not use real sensitive, medical, identity, or emergency information.

Password recovery, email verification, OAuth, production rate limiting, account deletion, external notifications, messaging, and abuse reports require additional implementation and service configuration. Rate limiting included here is in-memory and suitable only for a single-process local demo.

## Deployment status

The checked-in implementation uses a local SQLite file and Node's built-in SQLite API. That is convenient for local evaluation but is not a durable shared database for serverless/multi-instance deployment. Before staging/production, migrate this data layer to PostgreSQL (the schema relationships are outlined in [docs/data-model.md](docs/data-model.md)), add deployment-compatible migrations and backups, configure durable file storage and email, and complete operational/security review. Do not deploy this SQLite setup to Vercel as a multi-user production service.

## Testing and known gaps

The current automated suite covers initiative state transitions, reviewer role checks, initiative input validation, deterministic matching, and slugging. It does not yet cover browser flows, database integration, payment webhook security, upload safety, or production authorization review. See [docs/known-limitations.md](docs/known-limitations.md) for the precise deferred scope.
