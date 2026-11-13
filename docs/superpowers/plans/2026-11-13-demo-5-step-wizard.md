# Demo 5 Three-Step Photo Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Demo 5’s long form and repeated category capture controls with the approved polished three-step wizard, one shared capture area, post-capture classification, and tabbed photo review.

**Architecture:** Extend the shared domain for an optional `other` category, make new photo edits start unclassified, and keep category selection inside the editor. Refactor the form into three rendered steps and replace `DemoFivePhotoCategory` with a shared capture input plus a presentational tabbed gallery; preserve the existing draft, preparation, retry, upload, and confirmation services.

**Tech Stack:** Next.js 16.4.5, React 19, TypeScript, IndexedDB, Supabase/PostgreSQL, Node test runner, Playwright

**Spec:** `docs/superpowers/specs/2026-11-13-demo-5-step-wizard-design.md`

## Global Constraints

- Steps are exactly User Information, Payment Information, and Property Photos; forward buttons say only `Next`.
- Step 3 has one `Take Photo` camera control and one `Upload Image` picker control.
- New photos receive Category, Photo Type, Condition Status, and Description only after capture.
- Categories are Exterior, Interior, Mechanical, Condition, and optional Other.
- Existing minimums remain 4 Exterior, 4 Interior, 1 Mechanical, and 1 Condition; Other has minimum 0.
- Interior alone retains Basement, Attic, and Garage N/A controls.
- Preserve existing drafts, camera cancellation, image preparation, upload/retry, and confirmation behavior.

## Review Focus

- Step navigation cannot bypass required fields and Back never loses entered data.
- New capture begins unclassified while view/retake keeps the saved category until changed.
- Changing category resets an incompatible photo type before save.
- Other photos persist through IndexedDB, API validation, PostgreSQL, finalize, and retry without affecting minimums.
- Shared retake uses the camera, shared upload uses the picker, and cancellation restores focus without corrupting the saved photo.

---

### Task 1: Domain, wizard state, and post-capture editor

**Files:**
- Modify: `lib/demo-five/photo-workflow.ts`
- Modify: `lib/demo-five/photo-form-state.ts`
- Modify: `components/photographer-guide/demo-five-photo-editor.tsx`
- Test: `tests/demo-five-photo-workflow.test.mjs`
- Test: `tests/demo-five-photo-form.test.mjs`

**Interfaces:**
- Produces: `PhotoCategory` including `other`; `PHOTO_TYPES.other = ["other"]`; `PHOTO_MINIMUMS.other = 0`; `WizardStep`; `validateWizardStep(step, draft)`; `wizardStepForDraft(draft)`; `PhotoEdit.category: PhotoCategory | ""`.

- [ ] **Step 1: Write failing domain and state tests**

Assert Other is accepted only with photo type Other, contributes no required minimum, and does not receive N/A. Assert Step 1 requires valid name/email/phone, Step 2 requires payment method and HTTPS payment URL, Step 3 requires address for submission, and restored drafts select the approved step.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/demo-five-photo-workflow.test.mjs tests/demo-five-photo-form.test.mjs`

Expected: FAIL because Other and wizard helpers do not exist.

- [ ] **Step 3: Implement domain and step helpers**

Extend the category maps and minimum counts without changing the four required thresholds. Add pure step validation/restoration helpers using the existing field limits and HTTPS rules.

- [ ] **Step 4: Write failing editor tests**

Render a new unclassified edit and assert Category appears before Photo Type, all five categories exist, photo types follow the chosen category, and changing category clears an incompatible type. Render a retake and assert it starts with the existing category.

- [ ] **Step 5: Implement post-capture category selection**

Allow an empty category only while editing; require a valid category before save. Reset `photoType` whenever its current value is absent from the newly selected category.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `node --test tests/demo-five-photo-workflow.test.mjs tests/demo-five-photo-form.test.mjs tests/demo-five-photo-draft.test.mjs tests/demo-five-photo-submission-api.test.mjs`

Expected: PASS.

### Task 2: Three-step form and shared capture controls

**Files:**
- Modify: `components/photographer-guide/demo-five-submission-form.tsx`
- Modify: `components/photographer-guide/demo-five-photo-category.tsx` into a presentation-only tab panel, or replace it with `components/photographer-guide/demo-five-photo-tabs.tsx`
- Modify: `app/globals.css`
- Test: `tests/demo-five-photo-form.test.mjs`

**Interfaces:**
- Consumes: Task 1 wizard helpers, five-category domain, and unclassified `PhotoEdit`.
- Produces: the approved rendered steps, one shared pair of file inputs, and tabbed photo review with category counts.

- [ ] **Step 1: Write failing rendered-form tests**

Assert Step 1 initially shows only name/email/phone and `Next`; Step 2 shows only payment fields with Back/Next; Step 3 shows address, landscape guidance, exactly one camera input with `capture="environment"`, exactly one non-capture picker, and no category capture inputs.

- [ ] **Step 2: Implement wizard rendering and navigation**

Track `WizardStep` in the form, validate the current step before advancing, preserve draft state on Back, announce errors/status, and apply restoration-step behavior.

- [ ] **Step 3: Write failing shared-capture and tab tests**

Assert new capture dispatches an empty category, all five tabs show counts, saving activates the selected category, Interior contains the only N/A disclosure, cards retain View/Retake/Remove, and empty tabs show the approved empty state.

- [ ] **Step 4: Implement shared capture and tabbed review**

Move hidden inputs and trigger/retake refs to the form. Render one shared action row and a five-tab gallery. Make Retake set the existing photo and open the shared camera; keep cancellation focus and saved data intact.

- [ ] **Step 5: Apply the polished responsive design**

Implement the approved hierarchy, spacing, progress segments, primary/secondary actions, wrapped pill tabs, photo cards, focus states, and 320px-safe layout using Demo 5-scoped CSS.

- [ ] **Step 6: Run form and workflow tests**

Run: `node --test tests/demo-five-photo-form.test.mjs tests/demo-five-photo-workflow.test.mjs`

Expected: PASS.

### Task 3: Persistence and database support for Other

**Files:**
- Create: `supabase/migrations/202611130004_demo_five_other_category.sql`
- Modify: `tests/demo-five-photo-draft.test.mjs`
- Modify: `tests/demo-five-photo-submission-api.test.mjs`
- Modify: `tests/demo-five-photo-schema.test.mjs`

**Interfaces:**
- Consumes: Task 1’s `other` category.
- Produces: complete local/API/database persistence for optional Other photos.

- [ ] **Step 1: Write failing draft, API, and PGlite tests**

Round-trip an Other photo locally, prepare/finalize a manifest containing an Other photo in addition to all required photos, accept `other/other`, reject cross-category pairings, and confirm Other does not satisfy or reduce any required minimum.

- [ ] **Step 2: Run focused persistence tests and verify RED**

Run: `node --test tests/demo-five-photo-draft.test.mjs tests/demo-five-photo-submission-api.test.mjs tests/demo-five-photo-schema.test.mjs`

Expected: schema test FAILS because the database constraint does not yet accept Other.

- [ ] **Step 3: Add migration `202611130004`**

Replace `photographer_photos_classification` idempotently, preserving every photo type and six condition statuses from migration 003 while adding `(photo_category = 'other' and photo_type = 'other')`.

- [ ] **Step 4: Run focused persistence tests and verify GREEN**

Run the same command; expected PASS.

### Task 4: End-to-end verification and delivery

**Files:**
- Update tests only if a verified integration defect requires a test-first fix.

- [ ] **Step 1: Run full verification**

Run: `npm test`, `npm run lint`, `npm run build`, and `git diff --check`.

Expected: all tests pass, lint has zero errors, and build/diff checks succeed.

- [ ] **Step 2: Exercise the real mobile flow**

At 390×844: complete all steps; verify simple Next labels and Back preservation; use Upload Image; classify and save into each category; switch tabs; retake/remove; verify Interior-only N/A; confirm camera/picker attributes, focus, and no overflow.

- [ ] **Step 3: Obtain fresh whole-branch review**

Review against the spec and Review Focus; fix Critical/Important findings once using RED→GREEN tests and rerun the full suite.

- [ ] **Step 4: Commit, push, verify production, and hand off SQL**

Fast-forward `origin/main`, poll the live Demo 5 mobile flow, and provide migration `202611130004` for hosted Supabase execution.
