# Resend Submission Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a best-effort Resend notification after each photographer submission is saved to Supabase.

**Architecture:** A focused server-only notification module builds the email and calls Resend's REST endpoint. The existing route handler awaits database persistence first, then catches notification failures so the saved submission still returns HTTP 201.

**Tech Stack:** TypeScript, Web Fetch API, Next.js 16 route handlers, Node test runner, Resend Email API

**Spec:** `docs/superpowers/specs/2026-11-12-resend-submission-notifications-design.md`

## Global Constraints

- `RESEND_API_KEY` is server-only and must not be committed or exposed to the browser.
- Database persistence determines submission success; email failures never change a successful insert into an error.
- Do not log submission fields or Resend credentials.
- Use `Home Offer 365 Photographer Portal <notifications@send.homeoffer365.com>` as the sender.
- Send to `info@michaelpid.com` and CC `dialpodoutsourcing@gmail.com`.

## Review Focus

- Missing API key: skip delivery and return submission success after persistence.
- Non-2xx Resend response: log a generic failure and return submission success.
- Network exception: log a generic failure and return submission success.
- Unsafe field text: HTML-escape user-controlled values while preserving readable plain text.
- Operation ordering: never notify when validation or persistence fails.

---

### Task 1: Resend notification boundary

**Files:**
- Create: `lib/submissions/send-submission-notification.ts`
- Create: `tests/submission-notification.test.mjs`

**Interfaces:**
- Consumes: `SubmissionInput` from `lib/submissions/create-submission.ts`, an API key, and an injectable Fetch-compatible function.
- Produces: `sendSubmissionNotification(submission, options): Promise<"sent" | "skipped">`.

- [ ] **Step 1:** Write failing tests for sender/recipients, field content, HTML escaping, missing-key skip, and HTTP/network failures.
- [ ] **Step 2:** Run `node --test tests/submission-notification.test.mjs` and confirm the module is missing.
- [ ] **Step 3:** Implement the minimal formatter and Resend POST to `https://api.resend.com/emails` with HTML and text bodies.
- [ ] **Step 4:** Run the focused test and confirm it passes.

### Task 2: Best-effort route integration

**Files:**
- Modify: `lib/submissions/route-handler.ts`
- Modify: `tests/submission-route-db.test.mjs`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `sendSubmissionNotification` from Task 1.
- Produces: notification after a successful insert, with failures logged generically and HTTP 201 preserved.

- [ ] **Step 1:** Add failing tests for ordering, suppression on invalid/failed persistence, and HTTP 201 on notification rejection.
- [ ] **Step 2:** Run the focused route test and confirm the behavior is missing.
- [ ] **Step 3:** Inject and invoke the notifier after persistence using `RESEND_API_KEY`.
- [ ] **Step 4:** Document `RESEND_API_KEY` in `.env.example`.
- [ ] **Step 5:** Run focused tests and confirm they pass.

### Task 3: Release verification and hosted cleanup handoff

**Files:**
- No production file changes expected.

**Interfaces:**
- Consumes: completed Tasks 1 and 2.
- Produces: verified code and exact hosted configuration/cleanup instructions.

- [ ] **Step 1:** Run `npm test` and require zero failures.
- [ ] **Step 2:** Run `npm run build` and require a successful production build.
- [ ] **Step 3:** Run `git diff --check` and require no whitespace errors.
- [ ] **Step 4:** Report the Vercel `RESEND_API_KEY` requirement and exact SQL to drop the GHL trigger/function.
