# Simplified Photo Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the photographer photo checklist into a compact single-column accordion while preserving all content and accessibility.

**Architecture:** Keep the existing `details`/`summary` structure and shared checklist data. Simplify the rendered summary markup in the landing component, then adjust only the checklist-specific CSS for the one-column presentation.

**Tech Stack:** Next.js 16.4.5, React 19.3, TypeScript, CSS, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-10-simplified-photo-checklist-design.md`

## Global Constraints

- Preserve all five categories and every checklist item.
- Preserve native accordion keyboard behavior and the initially open first category.
- Do not add dependencies or change submission behavior.

## Review Focus

- All categories remain rendered from `checklistGroups`.
- All item lists remain inside their corresponding `details` elements.
- The first accordion remains open initially.
- Summary labels remain understandable without numbers or counts.
- Mobile and desktop layouts both use one column.

---

### Task 1: Simplify the photo checklist accordion

**Files:**
- Modify: `components/photographer-guide/photographer-landing.tsx`
- Modify: `app/globals.css`
- Test: `tests/photographer-landing.test.mjs`

**Interfaces:**
- Consumes: `checklistGroups` from `content/photographer-guide.ts`
- Produces: The existing `#photo-checklist` section with simplified native accordions

- [ ] **Step 1: Write the failing presentation test**

Add a test asserting that the checklist uses one column, omits the numbered and item-count summary markup, keeps `details`/`summary`, preserves `open={index === 0}`, and uses the shorter introduction.

- [ ] **Step 2: Run the focused test and verify it fails for the old numbered/count presentation**

Run: `node --test --test-name-pattern="photo checklist uses compact collapsible rows" tests/photographer-landing.test.mjs`

- [ ] **Step 3: Implement the minimal JSX and CSS changes**

Remove the summary number and count elements, shorten the supporting sentence, set `.landing-checklist-grid` to one column, and reduce row padding while retaining the existing plus/minus affordance and expanded item list.

- [ ] **Step 4: Run the focused test, full test suite, and TypeScript check**

Run: `node --test --test-name-pattern="photo checklist uses compact collapsible rows" tests/photographer-landing.test.mjs`, `npm test`, and `npx tsc --noEmit`.

- [ ] **Step 5: Verify the live Demo 3 route**

Request `http://localhost:3000/photographers/demo-3` and confirm the checklist renders after the video section with all five native `details` elements.
