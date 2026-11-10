# Demo 4 Content and Gallery Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply all 11 requested Demo 4 content, hero, review, navigation, and gallery changes.

**Architecture:** Keep the route and form intact. Update the server-rendered page shell for hero/reviews/team, and extend the existing client samples component with reusable selected-image state for gallery tabs plus an embedded Street View iframe.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, CSS, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-10-demo-4-content-gallery-refresh-design.md`

## Global Constraints

- Demo 4 only; preserve Demo 1-3.
- Keep tabs and gallery controls keyboard accessible.
- Keep the page compact on mobile.

## Review Focus

- Switching category resets to that category's first gallery image.
- Thumbnail buttons expose selected state and useful labels.
- Embedded Street View remains contained on narrow screens.
- Hero logo remains visible without covering the photographer.
- Removed links and buttons do not remain in markup or CSS.

---

### Task 1: Hero, Team, and Reviews

**Files:**
- Modify: `components/photographer-guide/photographer-demo-four.tsx`
- Modify: `app/globals.css`
- Test: `tests/photographer-landing.test.mjs`

- [ ] Write failing assertions for the moved logo, removed CTAs, linked one-line team strip, revised review eyebrow, removed Google link, and five new names.
- [ ] Run the focused Demo 4 test and confirm failure.
- [ ] Implement the shell and scoped style changes.
- [ ] Run the focused test and confirm it passes.

### Task 2: Product-Style Sample Galleries

**Files:**
- Modify: `components/photographer-guide/demo-four-samples.tsx`
- Modify: `app/globals.css`
- Test: `tests/photographer-landing.test.mjs`

- [ ] Write failing assertions for multiple-image galleries, thumbnails, embedded Street View, `Video Tours`, and matching Exterior/Interior/Mechanicals behavior.
- [ ] Run the focused Demo 4 test and confirm failure.
- [ ] Implement reusable gallery state, thumbnail controls, embedded iframe, and responsive styles.
- [ ] Run the full tests and production build.

### Task 3: Review and Publish

**Files:** all modified files above plus this plan/spec.

- [ ] Review the diff against all 11 requests.
- [ ] Commit only Demo 4 changes without unrelated working-tree edits.
- [ ] Push `main` and verify the deployed page.

