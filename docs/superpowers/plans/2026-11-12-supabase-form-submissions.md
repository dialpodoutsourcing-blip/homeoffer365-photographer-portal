# Supabase Form Submissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Save the public photographer form to a private Supabase table without visitor authentication.

**Architecture:** A Next.js Route Handler validates JSON and writes through a server-only Supabase service-role client. The client form calls the route and renders pending, success, and safe error feedback; an RLS-enabled table exposes no anonymous read or write policy.

**Tech Stack:** Next.js 16.4 App Router, React 19, TypeScript, Supabase JS 2, PostgreSQL

**Spec:** `docs/superpowers/specs/2026-11-12-supabase-form-submissions-design.md`

## Global Constraints

- No visitor login or authentication.
- Never expose `SB_SECRET` through a `NEXT_PUBLIC_` variable.
- Accept only HTTPS links hosted by `drive.google.com` or `docs.google.com`.
- Do not expose saved submissions through anonymous database policies.

## Review Focus

- Missing or non-string JSON fields return 400 without a database write.
- Whitespace is trimmed and field length boundaries are enforced server-side.
- Non-Google, non-HTTPS, and credential-bearing Drive URLs are rejected.
- Missing server environment returns a safe 503 response.
- Database failures return a generic 500 response and the form stays editable for retry.

---

### Task 1: Submission validation and persistence boundary

**Files:**
- Create: `lib/submissions/create-submission.ts`
- Create: `tests/submission-api.test.mjs`

**Interfaces:**
- Produces: `validateSubmission(value: unknown): SubmissionInput | null`
- Produces: `createSubmission(value: unknown, insert: InsertSubmission): Promise<CreateSubmissionResult>`

- [ ] Write behavioral tests for valid normalized data, missing fields, length limits, invalid links, and persistence failures.
- [ ] Run `node --test tests/submission-api.test.mjs` and verify failure because the module is absent.
- [ ] Implement the smallest validation and dependency-injected persistence boundary that passes.
- [ ] Run `node --test tests/submission-api.test.mjs` and verify all cases pass.

### Task 2: Supabase route and private table

**Files:**
- Create: `app/api/submissions/route.ts`
- Create: `supabase/migrations/202611120001_photographer_submissions.sql`
- Modify: `tests/submission-api.test.mjs`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `createSubmission` from Task 1.
- Produces: `POST(request: Request): Promise<Response>`.

- [ ] Add failing route-contract and PGlite migration tests for responses, insert behavior, constraints, RLS, and privilege revocation.
- [ ] Run the focused test and verify it fails for the missing route/migration.
- [ ] Implement the server-only Supabase insert route, migration, and documented variables.
- [ ] Run the focused test and verify it passes.

### Task 3: Connect the form

**Files:**
- Modify: `components/photographer-guide/submission-form.tsx`
- Modify: `tests/photographer-landing.test.mjs`

**Interfaces:**
- Consumes: `POST /api/submissions`.
- Produces: pending, success, and retryable error UI.

- [ ] Change the existing form test to require the API call, pending state, truthful copy, and delayed confirmation.
- [ ] Run the focused test and verify it fails against the demo-only form.
- [ ] Implement async submission and accessible feedback while preserving existing fields and validation.
- [ ] Run the focused test and verify it passes.

### Task 4: Full verification

**Files:**
- Verify all modified files.

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Inspect `git diff --check` and the scoped diff for secrets or unrelated changes.
- [ ] Run the Next.js agent-feedback reporting pass required by `AGENTS.md`.
