# Demo 4 Payment Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add required Venmo/Zelle payment details to Demo 4 and persist and notify them through the existing submission workflow.

**Architecture:** Extend the existing submission input contract and validation, then thread the two normalized values through the form, API insert, and notification. Mirror the already-applied SQL in an idempotent repository migration.

**Tech Stack:** Next.js, React, TypeScript, Supabase/PostgreSQL, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-13-demo-4-payment-fields-design.md`

## Global Constraints

- Retain all existing Demo 4 fields and behavior.
- Only Venmo and Zelle are accepted.
- Only credential-free HTTPS payment links up to 2048 characters are accepted.
- Do not modify Demo 5.

## Review Focus

- Missing or unsupported payment methods are rejected.
- HTTP, malformed, credential-bearing, and oversized links are rejected.
- Normalized values reach both Supabase and the notification.
- Existing rows remain valid after migration.
- The new controls remain usable at 320px.

---

### Task 1: Payment contract and persistence

**Files:**
- Modify: `lib/submissions/create-submission.ts`
- Modify: `lib/submissions/route-handler.ts`
- Modify: `lib/submissions/send-submission-notification.ts`
- Create: `supabase/migrations/202611130005_demo_four_payment_fields.sql`
- Test: `tests/submission-api.test.mjs`
- Test: `tests/submission-route-db.test.mjs`
- Test: `tests/submission-notification.test.mjs`

- [ ] Add failing validation, persistence, migration, and notification assertions.
- [ ] Run focused tests and confirm failures are caused by missing payment fields.
- [ ] Implement the minimal contract, insert, notification, and idempotent migration changes.
- [ ] Run focused tests to green.

### Task 2: Demo 4 form controls

**Files:**
- Modify: `components/photographer-guide/submission-form.tsx`
- Test: `tests/photographer-landing.test.mjs`

- [ ] Add failing assertions for a required two-option native select and required HTTPS payment-link input.
- [ ] Run the focused test and confirm it fails.
- [ ] Add the controls and submit both values without changing existing fields.
- [ ] Run focused and full tests, lint, build, and a 320px browser check.
- [ ] Commit, review, push to `main`, and verify production.
