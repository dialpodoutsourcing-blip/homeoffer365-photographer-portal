# Demo 5 Sample-Based Photo Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Demo 5 photo-type choices match its sample-gallery captions and advise photographers to shoot horizontally.

**Architecture:** Expand the shared Demo 5 domain taxonomy and add an explicit label map so stored values remain stable while visible labels exactly match the gallery. Keep validation and the editor on the shared taxonomy; add landscape guidance to the submission form without rejecting portrait images.

**Tech Stack:** Next.js 16.4.5, React 19, TypeScript, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-13-demo-5-photo-types-design.md`

## Global Constraints

- Every current Exterior, Interior, Basement, and Mechanicals sample caption must be selectable in its corresponding submission category.
- Basement sample captions belong to Interior; Interior also keeps `Attic`, `Garage`, and `Other`.
- Condition retains `General Condition`, `Damage`, `Repair Needed`, and `Other`.
- The visible instruction is `Take all photos horizontally (landscape orientation).`
- Do not change minimums, N/A rules, upload schema, camera capture, or Choose Image behavior.
- Existing saved photo values remain valid where their machine values already exist; newly introduced captions receive stable snake-case values.

## Review Focus

- Acronyms and caption casing: visible labels must retain `AC`, `HVAC`, and gallery wording rather than automatic title casing.
- Old drafts: previously valid photo values must not become unreadable merely because choices expanded.
- Category isolation: an Exterior caption must be rejected for an Interior photo and vice versa.
- Optional features: Basement, Attic, and Garage must remain valid Interior N/A selections.
- Orientation: portrait images remain savable because horizontal orientation is guidance, not validation.

---

### Task 1: Shared sample-based photo taxonomy

**Files:**
- Modify: `lib/demo-five/photo-workflow.ts`
- Modify: `components/photographer-guide/demo-five-photo-editor.tsx`
- Test: `tests/demo-five-photo-workflow.test.mjs`
- Test: `tests/demo-five-photo-form.test.mjs`
- Update fixtures as required: `tests/demo-five-photo-draft.test.mjs`, `tests/demo-five-photo-submission-api.test.mjs`

**Interfaces:**
- Produces: `PHOTO_TYPES`, an explicit `PHOTO_TYPE_LABELS` record, `getPhotoTypeOptions(category)`, and `photoLabel(value)` behavior used by the editor and category cards.

- [ ] **Step 1: Write failing domain and rendered-editor tests**

Assert that each category returns the approved exact values and that labels reproduce all sample captions, including `Exterior AC condenser`, `Roof, soffit, and gutters`, `Hallway and room layout`, `Kitchen under-sink plumbing`, `Basement window and egress`, `Furnace and ductwork`, `HVAC service connections`, `Attic`, `Garage`, and `Other`. Assert cross-category values reject, N/A rules are unchanged, old existing values represented by the expanded taxonomy remain valid, and the editor renders the expanded options with exact caption casing.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/demo-five-photo-workflow.test.mjs tests/demo-five-photo-form.test.mjs`

Expected: FAIL because the expanded options and exact label map do not exist.

- [ ] **Step 3: Implement the expanded taxonomy and exact labels**

Add every Exterior sample caption; every Interior and Basement sample caption plus Attic, Garage, and Other; every Mechanical sample caption plus Other; and the unchanged Condition choices. Use stable snake-case values and an explicit label record. Update `photoLabel` to prefer the explicit record and retain its generic fallback for categories/statuses.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/demo-five-photo-workflow.test.mjs tests/demo-five-photo-form.test.mjs tests/demo-five-photo-draft.test.mjs tests/demo-five-photo-submission-api.test.mjs`

Expected: PASS.

### Task 2: Horizontal-photo guidance and final verification

**Files:**
- Modify: `components/photographer-guide/demo-five-submission-form.tsx`
- Modify: `app/globals.css` only if needed for readable presentation
- Test: `tests/demo-five-photo-form.test.mjs`

**Interfaces:**
- Consumes: the existing Demo 5 form layout.
- Produces: visible non-blocking landscape-orientation guidance above the category controls.

- [ ] **Step 1: Write a failing form test**

Assert the form renders the exact instruction `Take all photos horizontally (landscape orientation).` before `.demo-five-categories`, while portrait dimensions remain valid in the domain test.

- [ ] **Step 2: Run focused test and verify RED**

Run: `node --test tests/demo-five-photo-form.test.mjs tests/demo-five-photo-workflow.test.mjs`

Expected: FAIL because the instruction is absent.

- [ ] **Step 3: Add the guidance**

Render the exact instruction immediately before the photo category controls, using the existing form visual language and no orientation enforcement.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/demo-five-photo-form.test.mjs tests/demo-five-photo-workflow.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run: `npm test`, `npm run lint`, `npm run build`, and `git diff --check`.

Expected: 203 or more tests pass; lint has zero errors; build and diff checks succeed.

- [ ] **Step 6: Verify phone UI**

At 390×844, confirm the guidance is visible, dropdown labels match the galleries, Take Photo retains `capture="environment"`, Choose Image has no capture attribute, and there is no horizontal overflow.

- [ ] **Step 7: Commit and publish after review**

Commit the spec, plan, implementation, and tests; obtain a fresh read-only review; push the fast-forward commit to `origin/main`; repeat the phone check against the live Demo 5 URL.
