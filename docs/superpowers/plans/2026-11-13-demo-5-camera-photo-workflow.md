# Demo 5 Camera Photo Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace only Demo 5's Google Drive submission form with a resilient mobile-camera workflow that drafts classified photos locally and submits private files plus photographer/photo metadata to Supabase.

**Architecture:** Demo 5 receives its own client form, backed by shared pure workflow rules and an IndexedDB draft repository. Final submission creates an opaque server-side upload session, sends compressed images directly to a private Supabase bucket through short-lived signed upload URLs, then finalizes all metadata through a transactional database function. Demo 4 continues using the existing Google Drive form and API.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, native camera file input, Canvas image processing, IndexedDB, Supabase PostgreSQL/Storage, Node test runner, PGlite.

**Spec:** `docs/superpowers/specs/2026-11-13-demo-5-camera-photo-workflow-design.md`

## Global Constraints

- Do not alter Demo 4 or the root index submission workflow.
- Video capture is deferred and must not block photo submission.
- Category minimums are exactly Exterior 4, Interior 4, Mechanical 1, and Condition 1; N/A features do not count toward these minimums.
- Every saved photo requires a custom name, category-specific photo type, and `good_condition` or `damage` status; description is optional.
- Basement, Attic, Garage, Outbuilding, and applicable optional features can be marked N/A without a fake photo.
- Unsubmitted images and form data live in IndexedDB, not localStorage; failed submissions retain the draft.
- Images remain private; the browser never receives a Supabase service credential or permanent public URL.
- Use `SUPABASE_URL` and `SB_SECRET` only in server code, matching the repository's current environment convention.
- Preserve existing RLS and revoked direct browser table access.
- Read relevant guides in `node_modules/next/dist/docs/` before modifying App Router pages or route handlers.

## Review Focus

- A phone refreshes or closes with several large draft images: reopening Demo 5 restores all metadata and blobs without marking missing/corrupt records complete (Task 3 tests).
- A user double-clicks Submit or retries after an uncertain response: one idempotency key produces one finalized set of photo rows (Tasks 2 and 4 tests).
- One of several direct uploads fails or connectivity drops: successful drafts remain mapped, only failed/missing uploads retry, and confirmation stays closed (Tasks 4 and 5 tests).
- A client tampers with category, type, status, path, counts, or another session's object key: the server rejects finalization without inserting rows (Tasks 1, 2, and 4 tests).
- Camera/storage APIs are unavailable, denied, or out of quota: desktop file selection remains usable where possible and the UI reports the failure without losing existing drafts (Tasks 3 and 5 tests).

---

### Task 1: Photo workflow domain model and validation

**Files:**
- Create: `lib/demo-five/photo-workflow.ts`
- Test: `tests/demo-five-photo-workflow.test.mjs`

**Interfaces:**
- Produces: `PHOTO_CATEGORIES`, `PHOTO_TYPES`, `OPTIONAL_FEATURES`, `PHOTO_MINIMUMS`.
- Produces: `PhotoCategory`, `PhotoType`, `ConditionStatus`, `DraftPhoto`, `NotApplicableSelection`, `PhotographerDetails`, `PhotoSubmissionManifest`.
- Produces: `getPhotoTypeOptions(category)`, `validateDraftPhoto(photo)`, `countPhotosByCategory(photos)`, `validatePhotoMinimums(photos)`, and `validateSubmissionManifest(manifest)`.

- [ ] **Step 1: Write failing domain tests**

Add tests asserting literal category/type mappings, `4/4/1/1` minimums, `good_condition`/`damage`, valid N/A feature/category pairs, custom-name and description limits, unique client photo IDs, payment URL HTTPS validation, and rejection of spoofed type/category combinations.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --test tests/demo-five-photo-workflow.test.mjs`

Expected: FAIL because `lib/demo-five/photo-workflow.ts` does not exist.

- [ ] **Step 3: Implement the domain module**

Use stable lowercase values:

- `exterior`: `front`, `rear`, `sides`, `roof`, `yard`, `driveway`, `outbuildings`, `damage`, `other`.
- `interior`: `living_room`, `kitchen`, `hallway_room_layout`, `bedroom`, `bathroom`, `basement`, `attic`, `garage`, `under_sink`, `damage`, `other`.
- `mechanical`: `hvac`, `water_heater`, `electrical_panel`, `plumbing`, `other`.
- `condition`: `general_condition`, `damage`, `repair_needed`, `other`.

Make `validateSubmissionManifest` return a discriminated result `{ ok: true; value } | { ok: false; error }` with normalized strings and no browser-only dependencies.

- [ ] **Step 4: Run focused and full tests**

Run: `node --test tests/demo-five-photo-workflow.test.mjs && npm test`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/demo-five/photo-workflow.ts tests/demo-five-photo-workflow.test.mjs
git commit -m "feat: define demo 5 photo workflow rules"
```

---

### Task 2: Supabase schema, private bucket, and transactional finalization

**Files:**
- Create: `supabase/migrations/202611130001_demo_five_photo_uploads.sql`
- Create: `tests/demo-five-photo-schema.test.mjs`

**Interfaces:**
- Consumes: stable category/type/status values from Task 1 (duplicate them as SQL constraints because PostgreSQL cannot import TypeScript).
- Produces: tables `public.photographers`, `public.photographer_property_photos`, and `public.photographer_upload_sessions`.
- Produces: private Storage bucket `photographer-photos`.
- Produces: RPC `public.finalize_photographer_upload_session(p_session_id uuid, p_idempotency_key uuid, p_photos jsonb, p_not_applicable jsonb)` callable only by the service role.

- [ ] **Step 1: Write a failing PGlite migration test**

Test a fresh database and a compatibility database where the owner's first two tables already exist. Assert required columns, foreign keys, unique email behavior, `photo_type`, `condition_status`, upload-session status/idempotency/expiry/N/A columns, category/status constraints, row-level security, and revokes. Assert from migration text that the bucket is private and restricted to image MIME types.

- [ ] **Step 2: Run the migration test and verify RED**

Run: `node --test tests/demo-five-photo-schema.test.mjs`

Expected: FAIL because the migration does not exist.

- [ ] **Step 3: Implement the additive migration**

The migration must:

- safely create the first two tables when absent and add new columns when they already exist;
- add `photo_type text not null` and `condition_status text not null` for real photo rows;
- create `photographer_upload_sessions` with `id`, `photographer_id`, `property_address`, `idempotency_key`, `status` (`prepared`, `finalized`, `failed`, `expired`), `expected_paths jsonb`, `not_applicable jsonb`, `expires_at`, `created_at`, and `finalized_at`;
- enforce one unique idempotency key and one unique `(session_id, client_photo_id)` result through a `submission_session_id` and `client_photo_id` unique constraint on photo rows;
- insert/update the private `photographer-photos` bucket with explicit size/MIME limits;
- keep anon/authenticated table access revoked;
- implement `finalize_photographer_upload_session` as a security-definer transaction boundary that locks the session, accepts an identical retry as success, rejects expired/wrong-state sessions, validates every metadata path against `expected_paths`, inserts all rows, stores N/A JSON, and marks the session finalized.

- [ ] **Step 4: Test tampering, idempotency, and rollback**

Add literal tests for a wrong object path, invalid category/type/status, insufficient category counts, duplicate client ID, expired session, repeated identical finalize, and a failing insert leaving zero photo rows and an unfinalized session.

- [ ] **Step 5: Run schema and full tests**

Run: `node --test tests/demo-five-photo-schema.test.mjs && npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/202611130001_demo_five_photo_uploads.sql tests/demo-five-photo-schema.test.mjs
git commit -m "feat: add private photo upload schema"
```

---

### Task 3: IndexedDB draft storage and image preparation

**Files:**
- Create: `lib/demo-five/photo-draft-store.ts`
- Create: `lib/demo-five/prepare-photo.ts`
- Test: `tests/demo-five-photo-draft.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `DraftPhoto`, `PhotographerDetails`, and N/A types from Task 1.
- Produces: `PhotoDraft` and `PhotoDraftStore` with `load(draftKey)`, `save(draft)`, `delete(draftKey)`, and `list()`.
- Produces: `createIndexedDbPhotoDraftStore(indexedDB)` and `preparePhoto(file, browserImageTools)` returning `{ blob, width, height, mimeType, byteSize }`.

- [ ] **Step 1: Add the IndexedDB test dependency**

Run: `npm install --save-dev fake-indexeddb`

Expected: only `package.json` and `package-lock.json` dependency metadata changes.

- [ ] **Step 2: Write failing repository and image-preparation tests**

Use `fake-indexeddb` to assert blob round-trips, overwrite-by-key, list/delete, version upgrade, missing/corrupt-record handling, and quota-error propagation without deleting prior data. Inject image decode/canvas functions to assert orientation-normalized output, longest-edge cap, WebP/JPEG fallback, and rejection of non-image/empty/oversized input.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `node --test tests/demo-five-photo-draft.test.mjs`

Expected: FAIL because the draft modules do not exist.

- [ ] **Step 4: Implement IndexedDB and image preparation**

Use database `homeoffer365-demo-five`, version `1`, object store `photo-drafts`, and atomic read/write transactions. Scope draft keys to a normalized property address plus a stable browser draft ID. Cap the longest edge at `2400px`, target WebP quality `0.82`, fall back to JPEG quality `0.84`, and reject a prepared blob above `10 MiB`.

- [ ] **Step 5: Run focused and full tests**

Run: `node --test tests/demo-five-photo-draft.test.mjs && npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/demo-five/photo-draft-store.ts lib/demo-five/prepare-photo.ts tests/demo-five-photo-draft.test.mjs
git commit -m "feat: persist demo 5 photo drafts locally"
```

---

### Task 4: Prepare and finalize upload APIs

**Files:**
- Create: `lib/demo-five/photo-submission-service.ts`
- Create: `app/api/demo-five/submissions/prepare/route.ts`
- Create: `app/api/demo-five/submissions/finalize/route.ts`
- Create: `tests/demo-five-photo-submission-api.test.mjs`

**Interfaces:**
- Consumes: Task 1 manifest validation and Task 2 database/RPC contract.
- Produces: `preparePhotoSubmission(input, dependencies)` returning `{ sessionId, idempotencyKey, uploads: [{ clientPhotoId, objectPath, signedToken }] }`.
- Produces: `finalizePhotoSubmission(input, dependencies)` returning `{ submissionId, photographerId, photoCount }`.
- HTTP prepare accepts photographer/contact/payment details, property address, N/A values, and a photo manifest without blobs.
- HTTP finalize accepts session/idempotency identifiers and the uploaded metadata manifest.

- [ ] **Step 1: Write failing service/API tests**

Cover malformed JSON, missing configuration, invalid HTTPS payment URL, invalid minimums, duplicate IDs, wrong category/type/status, normalized case-insensitive email reuse, new photographer creation, contact/payment update, generated server-owned object paths, short-lived signed tokens, per-photo/total limits, session expiry, object existence/MIME verification, tampered paths, finalize RPC errors, idempotent retry, and sanitized errors/logging.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/demo-five-photo-submission-api.test.mjs`

Expected: FAIL because the service and routes do not exist.

- [ ] **Step 3: Implement an injected service boundary**

Follow `lib/submissions/route-handler.ts`: inject environment, clock, UUID creation, logger, and Supabase operations for real behavior without network mocks. Use `SUPABASE_URL` and `SB_SECRET`; create signed upload tokens with the private bucket; never accept client-selected object paths.

- [ ] **Step 4: Implement thin App Router endpoints**

Each `route.ts` delegates to the service handler and exports only `POST`. Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` first.

- [ ] **Step 5: Implement retry and cleanup behavior**

Prepare returns an existing non-expired session for the same idempotency key. Finalize verifies all expected objects before the RPC. On terminal finalize failure, attempt deletion only for paths recorded on that session; transient failure leaves the session retryable. Bound total photos to `100`, each prepared blob to `10 MiB`, and total declared bytes to `500 MiB`.

- [ ] **Step 6: Run focused and full tests**

Run: `node --test tests/demo-five-photo-submission-api.test.mjs && npm test`

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/demo-five/photo-submission-service.ts app/api/demo-five/submissions tests/demo-five-photo-submission-api.test.mjs
git commit -m "feat: add secure demo 5 photo submission API"
```

---

### Task 5: Demo 5 camera checklist form

**Files:**
- Create: `components/photographer-guide/demo-five-submission-form.tsx`
- Create: `components/photographer-guide/demo-five-photo-category.tsx`
- Create: `components/photographer-guide/demo-five-photo-editor.tsx`
- Create: `lib/demo-five/upload-photo-draft.ts`
- Modify: `components/photographer-guide/photographer-demo-five.tsx`
- Modify: `app/globals.css`
- Modify: `tests/photographer-landing.test.mjs`
- Create: `tests/demo-five-photo-form.test.mjs`

**Interfaces:**
- Consumes: Task 1 rules, Task 3 draft repository/image preparation, and Task 4 endpoints.
- Produces: `DemoFiveSubmissionForm`, used only by `PhotographerDemoFive`.
- Produces: `uploadPhotoDraft(draft, fetch, uploadToSignedUrl)` orchestrator returning a progress-aware result and retry state.

- [ ] **Step 1: Write failing Demo 4 isolation and Demo 5 form tests**

Assert Demo 4 still renders `SubmissionForm` and Google Drive copy. Assert Demo 5 renders `DemoFiveSubmissionForm`, contains no Drive field/copy, retains address suggestions, and includes name/email/phone/payment method/payment URL fields plus four category cards and literal `4/4/1/1` progress labels.

- [ ] **Step 2: Write failing interaction/orchestrator tests**

Cover camera input attributes, desktop picker fallback, permission cancellation, capture editor focus, required custom name/type/status, optional description, save thumbnail, multiple same-type photos, retake/remove count changes, N/A toggles, IndexedDB restore, quota error, offline submit guard, disabled submit below minimums, bounded upload progress, retrying only failed items, double-submit prevention, draft preservation on failure, cleanup on success, and confirmation opening only after finalize success.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `node --test tests/demo-five-photo-form.test.mjs tests/photographer-landing.test.mjs`

Expected: FAIL because the new form/components do not exist and Demo 5 still uses `SubmissionForm`.

- [ ] **Step 4: Implement the orchestration function**

`uploadPhotoDraft` prepares once per stable idempotency key, uploads at concurrency `3`, records successful client-photo IDs in the local draft, retries only missing/failed uploads, then finalizes. It exposes `{ phase, completed, total, currentPhotoName }` updates and never clears the draft itself.

- [ ] **Step 5: Implement the client form and category/editor components**

Reuse the existing address suggestion utilities and confirmation component. Payment Method is a required text input to avoid inventing unsupported payment providers; Payment URL is a required HTTPS URL. Use a hidden native file input with `accept="image/*" capture="environment"`, labeled buttons, dialog-like editor focus management, live regions, text counts, and view/retake/remove controls. Restore saved drafts after hydration and keep all Demo 5-only CSS under `.demo-five-photo-form`.

- [ ] **Step 6: Wire Demo 5 only**

Replace `<SubmissionForm />` with `<DemoFiveSubmissionForm />` in `photographer-demo-five.tsx`. Do not modify `photographer-demo-four.tsx`, `submission-form.tsx`, `/api/submissions`, or `app/page.tsx`.

- [ ] **Step 7: Run focused and full tests**

Run: `node --test tests/demo-five-photo-form.test.mjs tests/photographer-landing.test.mjs && npm test`

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add components/photographer-guide/demo-five-*.tsx components/photographer-guide/photographer-demo-five.tsx lib/demo-five/upload-photo-draft.ts app/globals.css tests/demo-five-photo-form.test.mjs tests/photographer-landing.test.mjs
git commit -m "feat: add demo 5 guided camera form"
```

---

### Task 6: Integrated verification and deployment handoff

**Files:**
- Modify if required by verified behavior only: files introduced in Tasks 1–5
- Verify: `docs/superpowers/specs/2026-11-13-demo-5-camera-photo-workflow-design.md`

**Interfaces:**
- Consumes: the complete feature from Tasks 1–5.
- Produces: a verified branch and the exact migration/environment/deployment instructions for the owner.

- [ ] **Step 1: Run the complete automated verification**

Run: `npm test && npm run lint && npm run build`

Expected: all tests PASS, lint has zero errors, and the production build lists `/photographers/demo-5` plus both Demo 5 API routes.

- [ ] **Step 2: Run browser verification at mobile and desktop widths**

Verify `390x844` and `1440x900`: camera/file selection, capture classification, draft restore after reload, 4/4/1/1 gating, N/A controls, upload progress/error retry, confirmation timing, keyboard navigation, focus return, and no horizontal overflow. Verify `/` and `/photographers/demo-4` still show the Google Drive form.

- [ ] **Step 3: Verify failure recovery with controlled faults**

Exercise offline mode, one failed signed upload, an expired session, repeated finalize, IndexedDB quota failure, and refresh during an incomplete submission. Confirm no duplicate rows, no lost local draft, and no confirmation before finalization.

- [ ] **Step 4: Review security boundaries**

Confirm browser bundles contain no `SB_SECRET`; table/bucket access stays private; object paths are server-generated; logs omit contact/address/signed-token values; MIME/count/size/category/type/status checks run server-side; and cleanup cannot delete outside the recorded session prefix.

- [ ] **Step 5: Provide the deployment handoff**

Give the owner the migration filename to run, required environment names (`SUPABASE_URL`, `SB_SECRET`), private bucket name, and smoke-test URL. Do not push/deploy until the migration is applied or the live form is explicitly gated to prevent submissions against missing schema.

- [ ] **Step 6: Commit any verification-only corrections**

```bash
git add <only-files-corrected-during-verification>
git commit -m "fix: harden demo 5 photo submission flow"
```

Skip this commit when verification required no code changes.
