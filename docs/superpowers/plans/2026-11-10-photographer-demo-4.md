# Photographer Demo 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a separate, conventional Demo 4 photographer landing page that contains the requested trust, sample, and submission content in a compact one-to-two-scroll desktop presentation.

**Architecture:** Create a dedicated server component for Demo 4 and expose it from a new App Router route with static metadata. Reuse the existing `SubmissionForm`, local property imagery, and videos; isolate all new presentation rules under a Demo 4 root class.

**Tech Stack:** Next.js 16.4.5 App Router, React 19.3, TypeScript, CSS, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-10-photographer-demo-4-design.md`

## Global Constraints

- Keep Demo 3 and production routes unchanged.
- Keep Demo 4 a conventional landing page, not a dashboard.
- Do not add network-dependent runtime content or a new backend.
- Preserve unrelated dirty-worktree changes.

## Review Focus

- The dedicated route must remain isolated from Demo 3.
- Every requested sample label must remain visible without hidden instructional pages.
- Review avatars must be local and must have accessible alternative text.
- Narrow screens must stack without horizontal page overflow.
- The existing submission form must keep its validation and honest demo-only messaging.

---

### Task 1: Demo 4 route and compact landing

**Files:**
- Create: `app/photographers/demo-4/page.tsx`
- Create: `components/photographer-guide/photographer-demo-four.tsx`
- Create: `public/images/review-avatars/*.svg`
- Modify: `app/globals.css`
- Modify: `tests/photographer-landing.test.mjs`

**Interfaces:**
- Consumes: `SubmissionForm(): JSX.Element`, existing local images and MP4 assets.
- Produces: `PhotographerDemoFour(): JSX.Element` and `/photographers/demo-4`.

- [ ] **Step 1: Write the failing regression test**

Assert that the Demo 4 route renders `PhotographerDemoFour`, the component contains the required welcome/team/exit/sample/form copy, exactly five review records and local avatar paths, and the stylesheet contains scoped responsive Demo 4 rules. Also assert Demo 3 does not reference Demo 4.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/photographer-landing.test.mjs`
Expected: FAIL because `app/photographers/demo-4/page.tsx` does not exist.

- [ ] **Step 3: Implement the route, component, local avatars, and scoped styles**

Use a static metadata export, four shallow page bands, five concise review cards, a compact visual sample grid, the two existing videos, and the existing `SubmissionForm` under a “Photographer’s Info” heading.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/photographer-landing.test.mjs`
Expected: all tests in the file pass.

- [ ] **Step 5: Verify the project**

Run: `npm test`, `npm run lint`, and `npm run build`.
Expected: all commands exit 0.
