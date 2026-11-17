# Homeowner Multishot Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let homeowners select a broad property area and automatically save repeated camera shots without entering names or photo details.

**Architecture:** Keep the existing draft, image preparation, upload, and submission pipeline. Add a single automatic metadata factory at the workflow boundary, make the form capture directly into the selected category, and evolve the database classification to accept new Basement records while preserving legacy Condition records.

**Tech Stack:** Next.js 16.4.5, React 19, TypeScript, IndexedDB, Supabase/PostgreSQL, Node test runner, PGlite

**Spec:** `docs/superpowers/specs/2026-11-17-homeowner-multishot-capture-design.md`

## Global Constraints

- Homeowner choices are exactly Exterior, Interior, Mechanical, Basement, and Other.
- No homeowner-facing photo name, type, condition, or description controls.
- Every successful shot is saved immediately and leaves its category selected.
- Camera capture is repeated one shot at a time; existing-image upload supports multiple selection.
- Existing saved drafts, legacy Condition records, retake, remove, review, persistence, and final submission remain compatible.
- Required counts are 4 Exterior, 4 Interior, 1 Mechanical, and 1 Basement; Other is optional.

## Review Focus

- A camera result arriving after the category changes must save to the category selected when capture opened; pin this in Task 2.
- A multi-image upload containing one invalid image must retain earlier successful images and identify the failed image; pin this in Task 2.
- Rapid repeated capture clicks must not open overlapping preparation/save operations; pin this in Task 2.
- Restoring a legacy draft containing Condition metadata must not corrupt or discard its stored photos; pin this in Task 2.
- Applying the migration to populated tables must preserve legacy Condition rows and accept new Basement rows; pin this in Task 3.

---

### Task 1: Automatic homeowner photo metadata

**Files:**
- Modify: `lib/demo-five/photo-workflow.ts`
- Modify: `lib/demo-five/photo-form-state.ts`
- Test: `tests/demo-five-photo-workflow.test.mjs`

**Interfaces:**
- Produces: `createAutomaticDraftPhoto(image: PreparedPhoto, category: NewPhotoCategory, sequence: number, existing?: DraftPhoto, capturedAt?: string): ValidationResult<DraftPhoto>`
- Produces: `NEW_PHOTO_CATEGORIES` for homeowner capture and a backward-compatible accepted category type including legacy `condition`.
- Produces: deterministic internal defaults: category-based name plus sequence, compatible category type, `good_condition`, and empty description.

- [ ] **Step 1: Write failing workflow tests**

Add tests asserting that `NEW_PHOTO_CATEGORIES` equals `exterior`, `interior`, `mechanical`, `basement`, `other`; automatic metadata validates without user input; Basement has minimum 1; legacy Condition metadata remains readable but is not selectable; and retake preserves the existing record ID/category.

- [ ] **Step 2: Run the workflow test and verify RED**

Run: `node --test tests/demo-five-photo-workflow.test.mjs`

Expected: FAIL because the new category set and `createAutomaticDraftPhoto` do not exist.

- [ ] **Step 3: Implement the automatic metadata boundary**

Split selectable categories from accepted legacy categories, add Basement with internal photo type `basement` and the exact minimums, and implement `createAutomaticDraftPhoto` as the only path that invents hidden homeowner metadata.

- [ ] **Step 4: Remove obsolete editor state**

Delete classification/editor transitions from `photo-form-state.ts`; retain only capture, submission, error, and confirmation state needed by direct saves.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `node --test tests/demo-five-photo-workflow.test.mjs tests/demo-five-photo-draft.test.mjs`

Expected: all tests pass, including legacy draft compatibility.

- [ ] **Step 6: Commit**

```powershell
git add lib/demo-five/photo-workflow.ts lib/demo-five/photo-form-state.ts tests/demo-five-photo-workflow.test.mjs tests/demo-five-photo-draft.test.mjs
git commit -m "feat: add automatic homeowner photo metadata"
```

### Task 2: Category-first repeated capture and automatic saving

**Files:**
- Modify: `components/photographer-guide/demo-five-submission-form.tsx`
- Modify: `components/photographer-guide/demo-five-photo-category.tsx`
- Modify: `components/photographer-guide/demo-five-photo-editor.tsx`
- Modify: `app/globals.css`
- Test: `tests/demo-five-photo-form.test.mjs`

**Interfaces:**
- Consumes: `NEW_PHOTO_CATEGORIES` and `createAutomaticDraftPhoto(...)` from Task 1.
- Produces: category selection followed by native `Take Photo`; direct persistence after approval; `Take Another Photo`; and multi-file Upload Photos.

- [ ] **Step 1: Write failing form tests**

Add tests asserting the category must be selected before capture/upload; camera input saves directly without mounting the detail editor; the captured category is stable if the visible selection changes; saved confirmation exposes Take Another Photo; repeated shots increase the same category count; upload input has `multiple` and processes files sequentially; partial batch failure retains earlier saves; retake replaces the existing photo; legacy draft photos survive restore; and busy state blocks overlapping capture.

- [ ] **Step 2: Run the form test and verify RED**

Run: `node --test tests/demo-five-photo-form.test.mjs`

Expected: FAIL because capture still opens the editor and upload accepts one file.

- [ ] **Step 3: Implement category-first capture**

Render the five category controls before the camera actions, disable actions until selection, snapshot the selected category in `openCamera`, prepare the returned image, call `createAutomaticDraftPhoto`, persist it immediately, update the active count, and show `Photo saved` plus `Take Another Photo`.

- [ ] **Step 4: Implement sequential multi-image upload**

Set `multiple` only on Upload Photos, process its `FileList` in order through the same automatic-save function, retain successful saves, and stop with a filename-specific error on the first failed image.

- [ ] **Step 5: Simplify review and preview**

Remove homeowner-facing generated names and detail labels from thumbnails; keep View, Retake, and Remove. Reduce `demo-five-photo-editor.tsx` to the reusable blob preview plus a read-only dialog, or replace it with an equivalently focused preview component.

- [ ] **Step 6: Update capture copy and styles**

Use the exact labels `Take Photo`, `Take Another Photo`, and `Upload Photos`; remove copy instructing homeowners to add details; style category selection and saved confirmation within the existing compact form.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run: `node --test tests/demo-five-photo-form.test.mjs tests/demo-five-photo-workflow.test.mjs tests/demo-five-photo-draft.test.mjs`

Expected: all tests pass.

- [ ] **Step 8: Commit**

```powershell
git add components/photographer-guide/demo-five-submission-form.tsx components/photographer-guide/demo-five-photo-category.tsx components/photographer-guide/demo-five-photo-editor.tsx app/globals.css tests/demo-five-photo-form.test.mjs
git commit -m "feat: auto-save repeated homeowner photos"
```

### Task 3: Basement persistence and release verification

**Files:**
- Create: `supabase/migrations/202611170002_homeowner_basement_photos.sql`
- Modify: `tests/demo-five-photo-schema.test.mjs`
- Modify: `tests/demo-five-photo-submission-api.test.mjs`
- Modify: `tests/demo-five-photo-rate-limit.test.mjs`

**Interfaces:**
- Consumes: Basement metadata and required counts from Task 1.
- Produces: database constraints and finalize validation that accept Basement while retaining legacy Condition rows.

- [ ] **Step 1: Write failing persistence tests**

Update API fixtures to use Basement and add schema tests proving a Basement photo finalizes, a missing Basement photo fails minimum validation, legacy Condition rows survive, and the migration is idempotent on populated migration-004 data.

- [ ] **Step 2: Run persistence tests and verify RED**

Run: `node --test tests/demo-five-photo-submission-api.test.mjs tests/demo-five-photo-schema.test.mjs tests/demo-five-photo-rate-limit.test.mjs`

Expected: FAIL because PostgreSQL constraints and finalize minimums do not accept Basement.

- [ ] **Step 3: Add the backward-compatible migration**

Replace the classification constraint and finalize function so new `basement:basement` metadata is valid. The API requires Basement for all new manifests; the database accepts either one Basement or one legacy Condition photo so an already-prepared legacy retry can still finalize. Keep `condition` and its legacy types valid for existing rows, and make repeat application safe.

- [ ] **Step 4: Run persistence tests and verify GREEN**

Run: `node --test tests/demo-five-photo-submission-api.test.mjs tests/demo-five-photo-schema.test.mjs tests/demo-five-photo-rate-limit.test.mjs`

Expected: all tests pass.

- [ ] **Step 5: Run full verification**

Run: `npm test`

Expected: 0 failures.

Run: `npm run build`

Expected: production build exits 0.

Run: `git diff --check`

Expected: no output.

- [ ] **Step 6: Verify production routes locally**

Run the production server and confirm `/photographers/homeowners` returns 200 and `/photographers/demo-5` returns 308 to `/photographers/homeowners`.

- [ ] **Step 7: Commit**

```powershell
git add supabase/migrations/202611170002_homeowner_basement_photos.sql tests/demo-five-photo-schema.test.mjs tests/demo-five-photo-submission-api.test.mjs tests/demo-five-photo-rate-limit.test.mjs
git commit -m "feat: support homeowner basement photos"
```
