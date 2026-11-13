# Demo 5 Compact Photo Category Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make empty Demo 5 photo-category cards compact by showing only the category/count, capture buttons, and a collapsed N/A disclosure.

**Architecture:** Change only the existing Demo 5 category component and its scoped CSS. Preserve all capture, labeling, thumbnail, draft, and submission logic; use native `<details>` for the accessible N/A disclosure.

**Tech Stack:** React 19, TypeScript, CSS, Node test runner, Next.js 16.

**Spec:** `docs/superpowers/specs/2026-11-13-demo-5-compact-photo-category-design.md`

## Global Constraints

- Demo 4, the homepage, APIs, database, Storage, and submission rules remain unchanged.
- Remove the always-visible photo-type hint from every category card.
- Keep `Take Photo` and `Choose Image` as the only always-visible empty-card controls below the header.
- Render a closed-by-default `Mark feature N/A` disclosure only for categories with optional features.
- Preserve current N/A values when the disclosure closes.
- Preserve thumbnails and View, Retake, and Remove actions.

## Review Focus

- A category with no optional features must not render an empty N/A disclosure.
- Closing/reopening the N/A disclosure must not change checked values.
- Existing photos must still render below the compact controls.
- Camera and file-picker buttons must retain their current labels and behavior.
- Phone-width cards must not overflow or introduce excessive blank space.

---

### Task 1: Compact the category controls

**Files:**
- Modify: `components/photographer-guide/demo-five-photo-category.tsx`
- Modify: `app/globals.css`
- Modify: `tests/demo-five-photo-form.test.mjs`

**Interfaces:**
- Consumes: existing `OPTIONAL_FEATURES`, N/A callbacks, capture callbacks, and photo rendering.
- Produces: the same `DemoFivePhotoCategory` public component contract with compact presentation only.

- [ ] **Step 1: Add failing regression assertions**

Assert the component no longer renders `demo-five-type-hint` or calls `getPhotoTypeOptions`; optional features render inside a native `<details>` with summary text `Mark feature N/A`; the disclosure lacks `open`; and it renders only when `OPTIONAL_FEATURES[category].length > 0`.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/demo-five-photo-form.test.mjs`

Expected: FAIL against the current always-visible hint and N/A controls.

- [ ] **Step 3: Implement the compact component**

Remove the type-hint import/render. Wrap existing N/A checkboxes in a conditional closed `<details className="demo-five-na-disclosure">` with `<summary>Mark feature N/A</summary>`; do not change checkbox state or callbacks.

- [ ] **Step 4: Add scoped compact CSS**

Style the disclosure summary as a small secondary text action with tight spacing and keep expanded checkboxes wrapping cleanly. Do not alter thumbnail controls.

- [ ] **Step 5: Verify focused and complete behavior**

Run: `node --test tests/demo-five-photo-form.test.mjs && npm test && npm run lint && npm run build`

Expected: all tests pass, lint has no new errors/warnings, and build succeeds.

- [ ] **Step 6: Verify at phone width**

At `390x844`, confirm the empty category card shows only header/count, two photo buttons, and collapsed N/A summary, with no horizontal overflow.

- [ ] **Step 7: Commit**

```bash
git add components/photographer-guide/demo-five-photo-category.tsx app/globals.css tests/demo-five-photo-form.test.mjs docs/superpowers/specs/2026-11-13-demo-5-compact-photo-category-design.md docs/superpowers/plans/2026-11-13-demo-5-compact-photo-category.md
git commit -m "fix: compact demo 5 photo categories"
```
