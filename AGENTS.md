# Zlo

This file provides context about the project for AI assistants.

## Project Overview

- **Ecosystem**: TypeScript

## Tech Stack

- **Runtime**: none
- **Package Manager**: bun

### Frontend

- Framework: next
- CSS: tailwind
- UI Library: shadcn-ui

### Backend

- Framework: self
- API: trpc
- Validation: zod

### Database

- Database: postgres
- ORM: drizzle

### Authentication

- Provider: better-auth

### Additional Features

- Testing: vitest

## Project Structure

```
Zlo/
├── apps/
│   ├── web/         # Frontend application
├── packages/
│   ├── api/         # API layer
│   ├── auth/        # Authentication
│   └── db/          # Database schema
```

## Common Commands

- `bun install` - Install dependencies
- `bun dev` - Start development server
- `bun build` - Build for production
- `bun test` - Run tests
- `bun db:push` - Push database schema
- `bun db:studio` - Open database UI

## Better Fullstack project context

`bts.jsonc` is the authority for the current Stack Graph. Its `stackParts` array owns role selection and `ownerPartId` bindings. Top-level option fields are a compatibility projection and must not become a second mutation path.

### Stack Parts, ownership, and evidence

- `backend.api:typescript:trpc`. It belongs to `backend:typescript:self`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.auth:typescript:better-auth`. It belongs to `backend:typescript:self`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.effect:typescript:effect`. It belongs to `backend:typescript:self`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.orm:typescript:drizzle`. It belongs to `backend:typescript:self`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.testing:typescript:vitest`. It belongs to `backend:typescript:self`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.validation:typescript:zod`. It belongs to `backend:typescript:self`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend:typescript:self`. Its generated target is `apps/server`. Evidence is not mapped for this installed option.
- `database.dbSetup:universal:neon`. It belongs to `database:universal:postgres`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `database:universal:postgres`. Its generated target is `packages/db`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.css:typescript:tailwind`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.forms:typescript:react-hook-form`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.ui:typescript:shadcn-ui`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend:typescript:next`. Its generated target is `apps/web`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `workspaceRunner:universal:turborepo`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.

### Installed-version authority

Use `bts.jsonc` for the generator and schema version. Use local package manifests and lockfiles for installed dependency versions. Do not assume that documentation for a newer Better Fullstack release matches this project.

### Compatibility and lifecycle safety

Run `create-better-fullstack context --json` for bounded roles, capabilities, evidence, compatibility issues, and safe next actions. Run `create-better-fullstack doctor --json` before repairing graph drift. Existing-project writes must start with a plan and use the exact review token. Use `create-better-fullstack recipes check --json` before editing recipe-owned paths or managed regions, and use recipe history plus project recovery commands to undo a reviewed operation.

User code outside an explicit Better Fullstack managed region is not generator-owned. Missing or changed managed-region hashes stop recipe planning for manual review.

<!-- <better-fullstack:recipes sha256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855> -->

<!-- </better-fullstack:recipes> -->

## Cross-Session AI Memory (MANDATORY)

`AI_MEMORY.md` is the shared long-term memory for AI sessions working on this repo. It exists so no
session repeats work, re-litigates decisions, or retries dead ends. It is committed to git on purpose
— keep it committed.

Every session MUST follow its protocol:

1. **Read** `AI_MEMORY.md` in full at the start, before writing code, together with
   `git log --oneline -10` and `git status` to reconcile reality with what it records.
2. **Use** it during the session: check its "Do Not Repeat", "Known Issues", and "Decisions"
   sections before starting a task, and use its repo map instead of re-exploring from scratch. Add
   new non-obvious findings immediately, not only at the end.
3. **Update** it before handing back: add exactly one entry to "Session Log" (newest first), rewrite
   "Handoff / Next Steps" for a blind successor, prune it to stay under ~200 lines, and include the
   file in your commit (`git add AI_MEMORY.md`). An uncommitted memory file is invisible to the
   next session.

Keep `AI_MEMORY.md` updated when: a task is completed, a decision is made, an approach is abandoned
as a dead end, a new service or package is added, or build/dev workflows change.

## Maintenance

Keep AGENTS.md updated when:

- Adding/removing dependencies
- Changing project structure
- Adding new features or services
- Modifying build/dev workflows

AI assistants should suggest updates to this file when they notice relevant changes.
