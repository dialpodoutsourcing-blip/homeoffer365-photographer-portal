# Demo 5 Premium Form Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Demo 5 into a flatter, understated premium mobile form without changing behavior.

**Architecture:** Retain the existing React markup and form contracts wherever possible. Refine the scoped `.demo-five-photo-form` CSS system and add only minimal presentational classes when needed for hierarchy.

**Tech Stack:** Next.js, React, TypeScript, CSS, Node test runner, Playwright browser verification

**Spec:** `docs/superpowers/specs/2026-11-13-demo-5-premium-form-polish-design.md`

## Global Constraints

- Preserve all form semantics and functionality.
- Avoid decorative nested containers.
- Preserve 44px touch targets and visible focus states.
- Prevent horizontal overflow at 320px and 390px.

## Review Focus

- All three wizard steps remain navigable and validated.
- Dropdown, camera, upload, category tabs, and submission controls remain accessible.
- Restored photo cards remain readable with three actions.
- Long labels and requirement text do not overflow at 320px.
- Disabled, focus, selected, warning, and error states remain distinct.

---

### Task 1: Premium form visual system

**Files:**
- Modify: `app/globals.css`
- Modify only if necessary: `components/photographer-guide/demo-five-submission-form.tsx`
- Test: `tests/demo-five-photo-form.test.mjs`

**Interfaces:**
- Consumes: existing Demo 5 class names and accessible form structure
- Produces: unchanged form behavior with a refined responsive presentation

- [ ] Establish a visual regression baseline at 320px and 390px.
- [ ] Refine the scoped form surface, hierarchy, typography, spacing, inputs, buttons, progress, tabs, cards, and notices.
- [ ] Verify the three-step browser flow, control semantics, touch sizes, and no-overflow requirement.
- [ ] Run the full test suite, scoped lint, and production build.
- [ ] Commit, review, push to `main`, and verify the production page.
