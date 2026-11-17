# Streamlined Homeowners Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a short homeowner-only photo submission page with a compact hero and a two-step, payment-free property-photo workflow.

**Architecture:** Keep the proven photo capture/upload pipeline and legacy internal route/table names, but narrow its public contact model to name, email, and phone. Make legacy payment columns nullable through a forward migration, preserve old draft compatibility, and scope all presentation changes to the Homeowners page.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase/PostgreSQL, IndexedDB, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-17-streamlined-homeowners-page-design.md`

## Global Constraints

- The canonical URL remains exactly `/photographers/homeowners`.
- Hero copy and image match the approved design exactly.
- Desktop hero height stays near 240px and mobile near 210px.
- No photographer, vendor, team, review, payment, or quick-reference language appears on the Homeowners page.
- Existing photo capture, classification, draft, retry, upload, rate-limit, and confirmation behavior remains intact.
- Historical payment values remain stored; new homeowner submissions store null payment columns.
- Demo 1 through Demo 4 remain unchanged.

## Review Focus

- A legacy IndexedDB draft containing payment fields still restores instead of being classified as corrupt.
- Removing a wizard step does not break Back/Next behavior, focus management, or incomplete-detail recovery.
- Prepare retries compare the new normalized contact shape consistently and do not invalidate identical submissions.
- Existing database rows retain payment values after migration while new rows can write nulls.
- Homeowners-specific hero CSS does not shorten or restyle Demo 4.

---

### Task 1: Compact Homeowner Page Shell

**Files:**
- Modify: `components/photographer-guide/homeowners-page.tsx`
- Modify: `app/globals.css`
- Modify: `tests/photographer-landing.test.mjs`

**Interfaces:**
- Consumes: `HomeownersPage()` and the existing `DemoFiveSubmissionForm`.
- Produces: a Homeowners-only shell containing the compact hero and form, with scoped `.homeowners-*` presentation hooks.

- [ ] **Step 1: Write the failing page-shell test**

Assert exact homeowner hero copy, the brick-home asset, scoped compact hero hooks, and the absence of `PHOTOGRAPHER PORTAL`, team strip, vendor feedback/reviews, quick reference, sample gallery, and the redundant outer `Photographer's Info` heading. Assert Demo 4 still contains its original sections and hero sizing hooks.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/photographer-landing.test.mjs`

Expected: FAIL because the current page still renders photographer, team, review, and sample content.

- [ ] **Step 3: Implement the compact page shell**

Reduce `HomeownersPage()` to the approved hero plus `DemoFiveSubmissionForm`. Use `exterior-front-left-curb.webp`, exact approved copy, the existing logo, and new route-scoped class names. Add desktop/mobile CSS heights near 240px/210px without modifying Demo 4 selectors.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/photographer-landing.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the page shell**

Commit only this task’s files with message `feat: streamline homeowners page shell`.

---

### Task 2: Two-Step Homeowner Photo Form

**Files:**
- Modify: `components/photographer-guide/demo-five-submission-form.tsx`
- Modify: `lib/demo-five/photo-form-state.ts`
- Modify: `lib/demo-five/photo-workflow.ts`
- Modify: `lib/demo-five/photo-draft-store.ts`
- Modify: `tests/demo-five-photo-form.test.mjs`
- Modify: `tests/demo-five-photo-workflow.test.mjs`
- Modify: `tests/demo-five-photo-draft.test.mjs`

**Interfaces:**
- Consumes: legacy `PhotoDraft` records and the existing photo editor/upload state machine.
- Produces: `HomeownerDetails` containing `name`, `email`, and `phone`; `WizardStep = 1 | 2`; payment-free `PhotoSubmissionManifest`; backward-compatible draft parsing.

- [ ] **Step 1: Write failing workflow and draft compatibility tests**

Assert valid manifests require homeowner contact, address, and photo data without payment fields; errors say homeowner/contact rather than photographer/payment; and legacy drafts with extra `paymentMethod`/`paymentUrl` strings still load while new drafts omit those fields.

- [ ] **Step 2: Run workflow/draft tests and verify RED**

Run: `node --test tests/demo-five-photo-workflow.test.mjs tests/demo-five-photo-draft.test.mjs`

Expected: FAIL because payment remains part of the required contact contract.

- [ ] **Step 3: Narrow the contact model and preserve legacy drafts**

Rename the public contact type to `HomeownerDetails`, containing only `name`, `email`, and `phone`. Remove payment normalization and validation from `validateSubmissionManifest`. Teach draft validation to require the three current fields while tolerating legacy extra payment fields.

- [ ] **Step 4: Run workflow/draft tests and verify GREEN**

Run: `node --test tests/demo-five-photo-workflow.test.mjs tests/demo-five-photo-draft.test.mjs`

Expected: PASS.

- [ ] **Step 5: Write the failing two-step UI tests**

Assert two progress steps, `Homeowner's Name`, no payment controls/copy, Step 1 contact validation, Step 2 address/photos, Back/Next behavior, focus changes, incomplete-detail recovery, and legacy draft restoration to the correct two-step position.

- [ ] **Step 6: Run the form test and verify RED**

Run: `node --test tests/demo-five-photo-form.test.mjs`

Expected: FAIL because the form still renders three steps and payment controls.

- [ ] **Step 7: Implement the two-step form**

Change `WizardStep` and step routing to `1 | 2`. Step 1 collects homeowner name/email/phone; Step 2 contains property address and the unchanged photo workflow. Update progress labels, navigation, errors, restoration, and incomplete-detail recovery while leaving capture/upload mechanics untouched.

- [ ] **Step 8: Run the form and related tests**

Run: `node --test tests/demo-five-photo-form.test.mjs tests/demo-five-photo-workflow.test.mjs tests/demo-five-photo-draft.test.mjs`

Expected: PASS.

- [ ] **Step 9: Commit the homeowner form**

Commit this task’s files with message `feat: convert photo form to homeowner flow`.

---

### Task 3: Payment-Free Persistence and Migration

**Files:**
- Create: `supabase/migrations/202611170001_homeowner_contacts_optional_payment.sql`
- Modify: `lib/demo-five/photo-submission-service.ts`
- Modify: `tests/demo-five-photo-submission-api.test.mjs`
- Modify: `tests/demo-five-photo-schema.test.mjs`
- Modify as required by shared fixtures: `tests/demo-five-photo-rate-limit.test.mjs`

**Interfaces:**
- Consumes: payment-free `HomeownerDetails` and `PhotoSubmissionManifest` from Task 2.
- Produces: persistence that reads legacy rows, saves current contact fields with null payment columns, and a migration preserving old values while removing NOT NULL constraints.

- [ ] **Step 1: Write failing service and migration tests**

Assert prepare/finalize accept payment-free homeowner contact, retries compare the new contact shape, `savePhotographer` writes `payment_method: null` and `payment_url: null`, and the migration preserves populated legacy values while allowing a new row with both columns null.

- [ ] **Step 2: Run service/schema tests and verify RED**

Run: `node --test tests/demo-five-photo-submission-api.test.mjs tests/demo-five-photo-schema.test.mjs tests/demo-five-photo-rate-limit.test.mjs`

Expected: FAIL because the service and schema still require payment data.

- [ ] **Step 3: Add the forward migration**

Create an idempotent transaction that drops NOT NULL from `public.photographers.payment_method` and `public.photographers.payment_url`, adds comments documenting legacy-only optional data, and leaves existing values unchanged.

- [ ] **Step 4: Update persistence for homeowner contacts**

Map existing rows without requiring payment values, write current name/email/phone plus null payment columns, and keep session/idempotency/upload behavior unchanged.

- [ ] **Step 5: Run service/schema tests and verify GREEN**

Run: `node --test tests/demo-five-photo-submission-api.test.mjs tests/demo-five-photo-schema.test.mjs tests/demo-five-photo-rate-limit.test.mjs`

Expected: PASS.

- [ ] **Step 6: Run complete verification**

Run: `npm test`, then `npm run build`, then `git diff --check`.

Expected: all tests pass, the Next.js production build succeeds, and no whitespace errors are reported.

- [ ] **Step 7: Verify route behavior**

Run the production server locally and assert `/photographers/homeowners` returns 200 while `/photographers/demo-5` returns 308 with `Location: /photographers/homeowners`.

- [ ] **Step 8: Commit persistence and migration**

Commit this task’s files with message `feat: remove homeowner payment requirements`.
