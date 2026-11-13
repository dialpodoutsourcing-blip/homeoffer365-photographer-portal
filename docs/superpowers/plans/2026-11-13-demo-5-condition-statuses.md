# Demo 5 Inspector-Style Condition Statuses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the condition assessment on every Demo 5 photo from two choices to six inspector-style statuses with clear definitions.

**Architecture:** Define status values, labels, and descriptions once in the Demo 5 domain module so editor rendering and validation cannot drift. Extend the existing database classification constraint with a forward migration while preserving all current photo-type and legacy-status behavior.

**Tech Stack:** Next.js 16.4.5, React 19, TypeScript, Node test runner, Supabase/PostgreSQL, PGlite

**Spec:** `docs/superpowers/specs/2026-11-13-demo-5-condition-statuses-design.md`

## Global Constraints

- Approved values: `good_condition`, `satisfactory`, `needs_maintenance`, `damage`, `non_functional`, and `not_accessible`.
- Use the exact labels and definitions in the approved design.
- Existing `good_condition` and `damage` drafts and submissions remain valid.
- `Not Accessible` asks for an explanation but does not technically require Description.
- Do not change photo types, minimums, N/A rules, camera behavior, image selection, or upload flow.

## Review Focus

- Every application boundary accepts all six values and rejects invented values.
- Labels and definitions stay attached to the correct machine values.
- Existing saved photos using `good_condition` or `damage` restore without modification.
- The database migration preserves the expanded photo-type constraint from migration `202611130002`.
- The status help remains readable in the mobile editor without horizontal overflow.

---

### Task 1: Shared condition-status domain model and editor

**Files:**
- Modify: `lib/demo-five/photo-workflow.ts`
- Modify: `components/photographer-guide/demo-five-photo-editor.tsx`
- Test: `tests/demo-five-photo-workflow.test.mjs`
- Test: `tests/demo-five-photo-form.test.mjs`

**Interfaces:**
- Produces: `CONDITION_STATUSES`, `CONDITION_STATUS_DETAILS`, `ConditionStatus`, and condition validation consumed by draft and submission flows.

- [ ] **Step 1: Write failing domain tests**

Assert the exact six values, labels, and definitions; validate a real photo for every approved status; reject `excellent`, `poor`, empty, and non-string values; confirm `good_condition` and `damage` remain valid.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/demo-five-photo-workflow.test.mjs`

Expected: FAIL because four statuses and the shared details do not exist.

- [ ] **Step 3: Implement the shared status model**

Add the exact constants and derive `ConditionStatus` from them. Replace the two-value conditional with membership validation.

- [ ] **Step 4: Write failing rendered-editor tests**

Render the real editor and assert all six option labels plus the selected status definition. Assert `Not Accessible` displays a prompt to explain why in Description.

- [ ] **Step 5: Run editor tests and verify RED**

Run: `node --test tests/demo-five-photo-form.test.mjs`

Expected: FAIL because the editor still renders only two hard-coded choices and no status guidance.

- [ ] **Step 6: Render statuses and guidance from the shared model**

Map the shared details into the select. Show the current definition beneath it and show a non-blocking Description prompt when `not_accessible` is selected.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run: `node --test tests/demo-five-photo-workflow.test.mjs tests/demo-five-photo-form.test.mjs tests/demo-five-photo-draft.test.mjs tests/demo-five-photo-submission-api.test.mjs`

Expected: PASS.

### Task 2: Database compatibility and delivery

**Files:**
- Create: `supabase/migrations/202611130003_demo_five_condition_statuses.sql`
- Modify: `tests/demo-five-photo-schema.test.mjs`

**Interfaces:**
- Consumes: the six shared status values from Task 1.
- Produces: a forward database constraint accepting all six statuses while retaining every current and legacy photo classification.

- [ ] **Step 1: Write a failing embedded-PostgreSQL test**

Apply migrations through `202611130002`, then insert/finalize every approved status and confirm `excellent` is rejected.

- [ ] **Step 2: Run schema test and verify RED**

Run: `node --test tests/demo-five-photo-schema.test.mjs`

Expected: FAIL with PostgreSQL check violation for `satisfactory`.

- [ ] **Step 3: Add and apply migration `202611130003` in the test harness**

Replace only `photographer_photos_classification`, copying the complete current photo-type rules from migration `202611130002` and expanding `condition_status` to the exact six values. Make repeated application safe.

- [ ] **Step 4: Run schema test and verify GREEN**

Run: `node --test tests/demo-five-photo-schema.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run: `npm test`, `npm run lint`, `npm run build`, and `git diff --check`.

Expected: all tests pass; lint has zero errors; build and diff checks succeed.

- [ ] **Step 6: Verify mobile UI**

At 390×844, open the editor and confirm all six choices and selected guidance are readable, camera/gallery contracts remain intact, and no horizontal overflow exists.

- [ ] **Step 7: Review, commit, publish, and hand off SQL**

Obtain a fresh whole-branch review, fix Important/Critical findings test-first, push the fast-forward commits to `origin/main`, verify production, and provide migration `202611130003` for hosted Supabase execution.
