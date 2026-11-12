# Full-screen Submission Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline submission receipt with the approved accessible, animated, no-scroll full-screen confirmation overlay and deploy it to production.

**Architecture:** Keep submission state in the existing client form. Render a focused confirmation component when the API succeeds, lock document scrolling for its lifetime, and reset the form state when it closes. Use local public images and CSS/SVG animation only.

**Tech Stack:** Next.js 16.4.5 App Router, React 19, TypeScript, CSS, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-12-submission-confirmation-design.md`

## Global Constraints

- No new dependencies.
- No changes to submission persistence or notification behavior.
- Confirmation must fit the viewport without scrolling.
- Animation runs once and is disabled by `prefers-reduced-motion`.
- Preserve unrelated package and untracked workspace changes.

## Review Focus

- A failed submission must keep the form visible and show its existing error.
- A successful submission must show the overlay only after the API response succeeds.
- Closing by button or Escape must restore a fresh form and document scrolling.
- Short viewports must compress instead of overflow.
- Keyboard focus and accessible dialog naming must remain correct.

---

### Task 1: Confirmation behavior and markup

**Files:**
- Create: `components/photographer-guide/submission-confirmation.tsx`
- Modify: `components/photographer-guide/submission-form.tsx`
- Test: `tests/submission-confirmation.test.mjs`

**Interfaces:**
- Consumes: `onClose: () => void`
- Produces: `SubmissionConfirmation`, a modal dialog that closes by button or Escape and restores scroll state

- [ ] Write tests that fail until successful form state renders the named dialog, the dialog exposes the approved copy/assets, and its close behavior is wired to reset the form.
- [ ] Run `node --test tests/submission-confirmation.test.mjs` and confirm the missing component/behavior failures.
- [ ] Implement the component and integrate it with the successful submission branch.
- [ ] Run the focused test and confirm it passes.

### Task 2: Responsive visual treatment and animation

**Files:**
- Modify: `app/globals.css`
- Test: `tests/submission-confirmation.test.mjs`

**Interfaces:**
- Consumes: confirmation class names from Task 1
- Produces: fixed viewport layout, curved photo treatment, responsive compression, one-time SVG animation, and reduced-motion fallback

- [ ] Add failing assertions for fixed viewport containment, hidden overflow, short-height adaptation, animation keyframes, and reduced-motion handling.
- [ ] Run the focused test and confirm the new assertions fail.
- [ ] Add the approved styles without altering unrelated landing-page rules.
- [ ] Run the focused test and full `npm test` suite.

### Task 3: Verify and publish

**Files:**
- Modify: `AGENTS.md` only if Next.js regenerates its authorized feedback block

**Interfaces:**
- Consumes: completed Tasks 1–2
- Produces: verified production deployment from `main`

- [ ] Run `npm run lint`, `npm test`, and `npm run build`.
- [ ] Render the success state locally at desktop and short mobile viewports and inspect for clipping or scrolling.
- [ ] Run the required Next.js agent-feedback reporting pass if qualifying feedback exists.
- [ ] Commit only the feature, its tests, spec, plan, and any authorized AGENTS.md regeneration.
- [ ] Push `main`, monitor the production deployment, and verify the live route responds successfully.
