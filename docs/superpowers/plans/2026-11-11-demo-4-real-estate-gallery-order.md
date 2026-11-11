# Demo 4 Real-Estate Gallery Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reclassify and order Demo 4 property photos as a natural real-estate tour, with one new matching fence/property-boundary image.

**Architecture:** Keep the change inside Demo 4's existing local `galleryGroups` data structure. Add one static generated asset, update gallery membership and sequence, and protect the behavior with source-level regression tests already used by this project.

**Tech Stack:** Next.js 16.4.5 App Router, React 19, TypeScript, `next/image`, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-11-demo-4-real-estate-gallery-order-design.md`

## Global Constraints

- Keep the change limited to Demo 4.
- New imagery must match the same modest brick bungalow, landscaping, lighting, and realistic Pennsylvania setting.
- Images must contain no people, text, logos, or watermarks.
- Do not change the main photo guide, shared slider, upload categories, or submission workflow.
- Preserve existing unrelated worktree changes.
- Follow the installed Next.js image conventions and retain accessible labels.

## Review Focus

- Under-sink plumbing appears only in Interior and directly after Kitchen.
- Outdoor HVAC and electrical equipment appear only in Exterior.
- Indoor breaker panel remains in Mechanicals rather than moving with the exterior meter.
- Every referenced image resolves to a project-local file.
- Tab selection and thumbnail behavior remain unchanged when gallery lengths change.

---

### Task 1: Pin Demo 4 gallery classification and order

**Files:**
- Modify: `tests/photographer-landing.test.mjs`
- Test: `tests/photographer-landing.test.mjs`

**Interfaces:**
- Consumes: Source text from `components/photographer-guide/demo-four-samples.tsx`
- Produces: Regression assertions for exact Demo 4 category membership, order, and local asset existence

- [ ] **Step 1: Write the failing regression test**

Add a test named `Demo 4 organizes property photos in real-estate tour order` that extracts the three gallery arrays and asserts:

- Exterior contains the five general property views followed by the new fence/property-boundary image, AC condenser, electrical-service context, and electrical-meter close-up.
- Interior contains living room, kitchen, under-sink plumbing, bedroom, bathroom, and laundry in that order.
- Mechanicals contains basement overview, furnace/ductwork, modern furnace, water heater, water softener, well pump, and breaker panel in that order.
- Under-sink is absent from Mechanicals; AC condenser and both exterior electrical images are absent from Mechanicals.
- The new fence image exists under `public/images/photo-examples/pennsylvania-brick-bungalow/`.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/photographer-landing.test.mjs`

Expected: FAIL because the current gallery puts under-sink and outdoor equipment in Mechanicals and has no fence image.

- [ ] **Step 3: Review the failure for specificity**

Confirm the failure names the new Demo 4 organization test rather than an unrelated pre-existing assertion.

---

### Task 2: Create the missing property-boundary image

**Files:**
- Create: `public/images/photo-examples/pennsylvania-brick-bungalow/exterior-fence-property-boundary.png`

**Interfaces:**
- Consumes: Existing Pennsylvania brick bungalow exterior images as visual references
- Produces: `/images/photo-examples/pennsylvania-brick-bungalow/exterior-fence-property-boundary.png`

- [ ] **Step 1: Inspect the existing exterior reference images**

Confirm the bungalow's brick color, roof, yard, tree coverage, daylight, and photographic perspective before generation.

- [ ] **Step 2: Generate one matching exterior boundary view**

Create a realistic MLS-style wide photograph that shows the same bungalow's side/rear property boundary and fence, with no people, text, logos, or watermarks.

- [ ] **Step 3: Visually inspect the generated asset**

Confirm it plausibly matches the property, clearly shows the fence/boundary, and contains no prohibited content or obvious generation artifacts.

---

### Task 3: Reclassify and reorder Demo 4 galleries

**Files:**
- Modify: `components/photographer-guide/demo-four-samples.tsx`
- Test: `tests/photographer-landing.test.mjs`

**Interfaces:**
- Consumes: The new boundary image path from Task 2
- Produces: Updated `galleryGroups` with agent-oriented Exterior, Interior, and Mechanicals sequences

- [ ] **Step 1: Read the installed Next.js image guide**

Read: `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`

- [ ] **Step 2: Update the Exterior array**

Keep the general exterior walkaround first, then add `Property boundary and fence`, `Exterior AC condenser`, `Exterior electrical service`, and `Exterior electrical meter` entries using project-local paths.

- [ ] **Step 3: Update the Interior array**

Move `Under-sink plumbing` directly after `Kitchen`, followed by bedroom, bathroom, and laundry.

- [ ] **Step 4: Update the Mechanicals array**

Retain only the indoor system overview and equipment images, ordered from basement overview to furnace systems, water systems, well pump, and indoor breaker panel.

- [ ] **Step 5: Run the focused test**

Run: `node --test tests/photographer-landing.test.mjs`

Expected: PASS.

---

### Task 4: Verify the complete change

**Files:**
- Verify: `components/photographer-guide/demo-four-samples.tsx`
- Verify: `public/images/photo-examples/pennsylvania-brick-bungalow/exterior-fence-property-boundary.png`
- Verify: `tests/photographer-landing.test.mjs`

**Interfaces:**
- Consumes: Completed gallery and test changes
- Produces: Verified Demo 4 implementation

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: exit code 0.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: successful Next.js production build.

- [ ] **Step 4: Review the working-tree diff**

Confirm only the approved Demo 4 gallery, its focused regression coverage, the generated boundary asset, and approved documentation are part of this task; do not alter unrelated user changes.

- [ ] **Step 5: Run the Next.js feedback reporting pass**

If verified Next.js feedback candidates remain, run `npx --no-install next internal agent-feedback-instructions` once and follow its output. Otherwise record that no qualifying framework issue was encountered.
