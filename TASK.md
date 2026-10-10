# Zlo Subscription Tracker SaaS — Master AI Context

## 1. Role and Objective

Act as a senior full-stack TypeScript engineer, software architect, database designer, security engineer, and pragmatic product developer.

Your task is to transform the existing **Zlo** repository into a production-ready Subscription Tracker SaaS.

Users should be able to manage recurring subscriptions, track spending, see upcoming renewals, review spending analytics, and receive renewal reminders.

Work directly with the existing codebase. Do not generate an unrelated starter project or replace the existing architecture.

Prioritize correctness, security, maintainability, simplicity, and a polished user experience.

## 2. Existing Project Context

Project: Zlo

Language: TypeScript  
Package manager: Bun  
Monorepo: Turborepo  
Frontend: Next.js App Router  
Styling: Tailwind CSS  
UI components: shadcn/ui  
API: tRPC  
Validation: Zod  
Database: PostgreSQL, potentially hosted on Neon  
ORM: Drizzle ORM  
Authentication: Better Auth  
Forms: React Hook Form  
Testing: Vitest

Known project layout:

- `apps/web`: Next.js frontend
- `packages/api`: API layer
- `packages/auth`: authentication
- `packages/db`: database schema

The Better Fullstack configuration also identifies `apps/server` as the generated target for `backend:typescript:self`. Inspect the actual repository and generator configuration to establish the authoritative structure before changing anything.

Common commands documented by the project:

- `bun install`
- `bun dev`
- `bun build`
- `bun test`
- `bun db:push`
- `bun db:studio`

Verify these commands against the actual workspace scripts before running them.

## 3. Mandatory Repository Protocol

Before writing or modifying code:

1. Read `AI_MEMORY.md` completely.
2. Run `git log --oneline -10`.
3. Run `git status`.
4. Inspect `AGENTS.md`, `bts.jsonc`, root `package.json`, workspace configuration, and relevant package manifests.
5. Inspect existing database schemas, authentication configuration, tRPC setup, exports, UI components, and tests.
6. Review the "Do Not Repeat", "Known Issues", "Decisions", and repository map sections of `AI_MEMORY.md`.
7. Identify existing conventions and reuse them.

The installed dependency versions and local configuration are authoritative. Do not assume newer framework APIs or generator behavior.

### Better Fullstack safety

The `bts.jsonc` file is the authority for the current Stack Graph.

- Read `create-better-fullstack context --json` to inspect roles, capabilities, evidence, compatibility, and safe next actions.
- Run `create-better-fullstack doctor --json` before repairing graph drift.
- Use the required planning and exact review token for existing-project generator writes.
- Run `create-better-fullstack recipes check --json` before editing recipe-owned paths or managed regions.
- Preserve user code outside explicit generator-managed regions.
- Follow recipe history and recovery procedures when reverting reviewed generator operations.

Do not casually edit generator-owned files or recreate files that already exist.

## 4. Product Definition

Zlo is a personal subscription tracking SaaS.

Users manually add recurring subscriptions such as:

- Streaming services
- Music services
- Software subscriptions
- Domains and hosting
- Productivity tools
- Other recurring expenses

The application tracks their prices, billing intervals, next billing dates, categories, status, and reminders.

The initial product is a tracker, not a payment processor.

Users record subscriptions they pay for elsewhere. Zlo must not charge users for those external subscriptions or claim to automatically detect bank transactions.

## 5. Core MVP Features

### A. Authentication

Use the existing Better Auth implementation.

- Support the existing configured sign-in methods.
- Protect dashboard and private routes.
- Obtain the authenticated user identity from the server-side session.
- Never trust a client-provided user ID.
- Enforce ownership in every protected database operation.
- Reuse existing authentication middleware and session conventions.

Do not replace Better Auth or introduce another authentication system.

### B. Subscription CRUD

Implement:

- Create subscription
- List subscriptions
- Get subscription details
- Update subscription
- Delete subscription
- Cancel subscription
- Pause and resume subscription, if supported by the product's status model
- Search, filter, sort, and paginate subscriptions

Suggested fields:

- ID
- User ID
- Subscription name
- Optional provider name or logo
- Amount
- ISO currency code
- Billing interval
- Billing interval count
- Start date
- Next billing date
- Optional trial end date
- Category
- Status
- Optional notes
- Created timestamp
- Updated timestamp

Supported billing intervals should include weekly, monthly, and yearly. Support quarterly and other recurring intervals through an interval-count model where practical.

Validate every input with Zod on the server.

Do not accept arbitrary user IDs from the client. Validate subscription ownership when reading, editing, or deleting a record.

### C. Dashboard

Build a responsive dashboard containing:

- Total active subscriptions
- Estimated monthly recurring cost
- Estimated annual recurring cost
- Upcoming renewals
- Recently added subscriptions
- Category-wise spending
- Spending history

All displayed values must come from real database records.

Handle empty states, loading states, errors, and users without subscriptions.

Clearly distinguish normalized monthly spending estimates from actual payment transactions.

### D. Renewal Calendar

Provide a calendar or list showing upcoming billing dates.

Users should be able to:

- View upcoming renewals
- Filter by time period
- Open subscription details
- Identify subscriptions approaching renewal

Use correct date and timezone handling.

### E. Analytics

Implement:

- Monthly spending estimates
- Annualized recurring costs
- Category breakdown
- Historical spending trends based on available data

Do not invent historical transactions. If historical payment records are not available, label the feature as recurring-cost estimates rather than actual historical spending.

### F. Renewal Reminders

Implement configurable reminders, initially through email.

Suggested defaults:

- Three days before renewal
- One day before renewal

Requirements:

- Store reminder preferences.
- Create and update scheduled reminders when subscriptions change.
- Cancel pending reminders for cancelled or deleted subscriptions.
- Prevent duplicate delivery.
- Track pending, sent, and failed states.
- Handle transient failures and retries.
- Respect user timezones and notification preferences.
- Never expose private subscription information in public endpoints.

Choose a suitable scheduler and email provider only after inspecting the deployment setup. Keep reminder processing separate from ordinary page requests.

If infrastructure is unavailable, complete the reminder domain logic and clearly document the remaining integration rather than pretending emails have been sent.

## 6. Database Design

Inspect existing Drizzle schemas and Better Auth tables first.

Create or extend schema modules for subscriptions and reminders, following current repository conventions.

Suggested logical tables:

### Subscription

- `id`
- `userId`
- `name`
- `amount`
- `currency`
- `interval`
- `intervalCount`
- `startDate`
- `nextBillingDate`
- `trialEndDate`
- `category`
- `status`
- `notes`
- `createdAt`
- `updatedAt`

### Reminder

- `id`
- `userId`
- `subscriptionId`
- `scheduledAt`
- `channel`
- `status`
- `sentAt`
- `dedupeKey`
- `createdAt`
- `updatedAt`

### Reminder preferences

Reuse an existing user-preferences table if appropriate. Otherwise, add a dedicated table or a suitable structured configuration.

Database requirements:

- Proper primary keys and foreign keys
- Appropriate indexes
- User ownership constraints
- Unique constraints where needed
- Consistent timestamps and date semantics
- Explicit deletion and reminder-history policies
- Safe migration practices

Represent money using integer minor units or an appropriate exact decimal type. Never use floating-point arithmetic for money.

Use a consistent currency convention and validate currency codes.

For multi-currency accounts, never sum unlike currencies without a defined exchange-rate conversion policy.

Use Drizzle migrations according to the repository's established workflow. Do not blindly apply schema changes to a production database.

## 7. Backend Architecture

Reuse the existing tRPC initialization, context, middleware, error handling, database client, and export conventions.

Organize procedures by domain where appropriate:

- `subscriptionRouter`
- `dashboardRouter`
- `reminderRouter`
- `preferencesRouter`

Suggested procedures:

Subscription:
- `list`
- `getById`
- `create`
- `update`
- `delete`
- `cancel`
- `pause`
- `resume`

Dashboard:
- `summary`
- `upcomingRenewals`
- `spendingHistory`
- `categoryBreakdown`

Reminder:
- `list`
- `updatePreferences`

Only implement procedures that fit the actual MVP requirements.

Use protected procedures for user data. Apply ownership filtering directly in database queries. Return predictable errors for invalid input, missing records, and unauthorized access.

Avoid duplicated validation, unnecessary abstraction layers, and giant router files.

Use database transactions when multiple related writes must succeed or fail together.

## 8. Frontend Architecture

Use the existing Next.js App Router and UI conventions.

Suggested routes:

- `/dashboard`
- `/subscriptions`
- `/subscriptions/new`
- `/subscriptions/[id]`
- `/calendar`
- `/analytics`
- `/settings`

Reuse the existing tRPC client integration and React Query configuration.

Use React Hook Form and Zod for forms if these are already installed and configured.

Use shadcn/ui components and the existing design tokens. Do not replace the current theme, global styling, radius configuration, or component conventions unnecessarily.

Build reusable components where appropriate:

- Dashboard metric cards
- Subscription list or table
- Subscription form
- Subscription detail panel
- Category selector
- Billing interval selector
- Status badges
- Upcoming renewal list
- Spending charts
- Empty states
- Loading skeletons
- Confirmation dialogs
- Notification preferences

Provide responsive layouts, keyboard accessibility, meaningful labels, useful validation messages, and clear success/error feedback.

Do not add decorative charts that display fabricated data.

## 9. Spending Calculation Rules

Implement tested, centralized recurring-cost calculation functions.

For an amount charged every `n` weeks:

Monthly equivalent = amount × 52 ÷ (12 × n)

For an amount charged every `n` months:

Monthly equivalent = amount ÷ n

For an amount charged every `n` years:

Monthly equivalent = amount ÷ (12 × n)

These are normalized estimates. Use exact or suitably precise decimal arithmetic and round only at presentation boundaries.

Annual equivalent = monthly equivalent × 12.

Document assumptions about billing intervals and calendar-based renewals.

Do not confuse a subscription's next renewal date with a completed payment. Advancing a billing date must not silently create a historical transaction.

Cancelled and expired subscriptions should not count as active recurring expenses. Define how paused and trial subscriptions affect metrics, then apply that policy consistently.

## 10. Security Requirements

Treat security as a core requirement.

- Enforce authentication server-side.
- Enforce per-user ownership in every protected operation.
- Prevent insecure direct object references.
- Validate all client input with Zod.
- Never expose secrets or private environment variables.
- Use existing authorization middleware.
- Do not trust client-supplied prices, ownership, roles, or session data.
- Avoid logging sensitive user information.
- Handle database and email errors safely.
- Protect scheduled endpoints using the hosting platform's supported authentication mechanism.
- Make background jobs idempotent and safe under concurrent execution.

Never claim security is complete without tests or meaningful verification.

## 11. Testing Strategy

Use the existing Vitest configuration.

Write tests for:

- Subscription creation and validation
- Subscription updates and deletion
- Cross-user access prevention
- Billing interval calculations
- Currency handling
- Upcoming renewal filtering
- Status transitions
- Reminder scheduling
- Reminder deduplication
- Retry behavior
- Empty dashboard data
- Invalid dates and amounts
- Relevant database constraints

Mock external email and scheduler integrations in unit tests.

Add integration tests using the repository's existing database-testing approach where practical.

Do not change the test framework unless necessary.

## 12. Implementation Workflow

Work incrementally in these phases.

### Phase 0: Repository audit

- Read required memory and project instructions.
- Inspect the actual monorepo structure.
- Verify existing authentication, database, tRPC, and UI integrations.
- Identify managed files and known issues.
- Run relevant baseline checks when safe.
- Report the current state and propose a bounded implementation plan.

Do not modify code during the audit phase.

### Phase 1: Database

- Add subscription schema.
- Add reminder schema if required for the first milestone.
- Define relations and indexes.
- Generate and inspect migrations.
- Validate schema types.

### Phase 2: Backend

- Add Zod schemas.
- Add protected tRPC procedures.
- Enforce ownership and validation.
- Add calculation utilities.
- Write backend tests.

### Phase 3: Frontend

- Build subscription listing and CRUD forms.
- Build dashboard cards.
- Integrate actual tRPC queries and mutations.
- Add loading, error, and empty states.
- Verify responsive behavior.

### Phase 4: Analytics and calendar

- Add upcoming renewals.
- Add recurring-cost summaries.
- Add category breakdown and spending history.
- Test calculations and filtering.

### Phase 5: Notifications

- Add reminder preferences.
- Integrate scheduled processing and email.
- Implement retries and deduplication.
- Test failure and concurrency scenarios.

### Phase 6: Verification

Run appropriate repository checks, including:

- TypeScript type checking
- Vitest tests
- Linting
- Production build
- Database migration validation

Use actual scripts found in the repository. Report any unavailable commands or failed checks honestly.

### Phase 7: Handoff

- Update `AI_MEMORY.md`.
- Add exactly one new entry to the Session Log, newest first.
- Rewrite Handoff / Next Steps for the next AI session.
- Keep the file near or below the documented 200-line target.
- Update `AGENTS.md` if dependencies, structure, features, services, or workflows change.
- Review `git diff` and `git status`.
- Include `AI_MEMORY.md` in the commit if creating a commit is authorized.
- Do not create a commit or push changes unless explicitly authorized by the user or existing task instructions.

## 13. Working Rules

1. Inspect before editing.
2. Preserve existing code and user changes.
3. Do not replace the stack.
4. Do not install a package when the current stack already provides the capability.
5. Verify actual package versions before using APIs.
6. Follow the repository's TypeScript conventions.
7. Prefer small, reviewable changes.
8. Avoid unrelated refactoring.
9. Do not fabricate successful test, build, migration, or deployment results.
10. Never silently discard uncommitted work.
11. If an architectural decision is uncertain, inspect the repository first.
12. If a critical decision cannot be resolved from the codebase, explain the issue and ask a focused question.
13. Record non-obvious findings and abandoned approaches in `AI_MEMORY.md`.
14. Do not claim a feature is complete when it is only scaffolded.

## 14. Definition of Done

The MVP is complete when:

- Authenticated users can create, view, update, and delete subscriptions.
- Users cannot access another user's subscriptions.
- Billing intervals and recurring-cost calculations are tested.
- The dashboard displays real data.
- Upcoming renewals are calculated correctly.
- The interface handles empty, loading, and error states.
- Relevant automated tests pass.
- Type checking, linting, and production build have been verified or their failures documented.
- Database changes follow the existing migration workflow.
- Memory and handoff documentation are updated.
- Remaining limitations and deployment requirements are clearly stated.

## 15. First Action

Start with **Phase 0: Repository audit only**.

Read `AI_MEMORY.md`, inspect Git history and working-tree status, review `AGENTS.md` and `bts.jsonc`, and inspect the actual workspace configuration and existing auth, API, and database implementations.

Do not write code until the audit is complete and the implementation plan is grounded in the actual repository.

Then proceed phase by phase, preserving the project's architecture and existing work.
