# Demo 5 Payment and Review Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved payment-method dropdown and professionally polish Demo 5's mobile photo-review panel.

**Architecture:** Keep the existing client component, draft schema, and submission contract. Change the payment control markup and refine existing scoped CSS only.

**Tech Stack:** Next.js, React, TypeScript, CSS, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-13-demo-5-payment-review-polish-design.md`

## Global Constraints

- Preserve existing draft and API field names.
- Use a native select and no new dependency.
- Preserve category requirements and tab accessibility.
- Prevent horizontal overflow at 320px.

## Review Focus

- A blank payment choice must remain invalid.
- Every approved payment choice must save as the selected draft value.
- Existing restored payment values must not crash the control.
- Category counts and minimums must remain unchanged.
- Long review text and tabs must not overflow narrow screens.

---

### Task 1: Payment dropdown and review-panel polish

**Files:**
- Modify: `components/photographer-guide/demo-five-submission-form.tsx`
- Modify: Demo 5 scoped stylesheet located by the component/page imports
- Test: `tests/demo-five-photo-form.test.mjs`

**Interfaces:**
- Consumes: existing `photographerField("paymentMethod", value)` and draft state
- Produces: the unchanged `paymentMethod: string` submission value

- [ ] Add a failing form test asserting a required native select and all seven approved options.
- [ ] Run the focused test and confirm it fails because Payment Method is still a text input.
- [ ] Replace the input with the native select while retaining name, required state, controlled value, and change handler.
- [ ] Add or refine scoped review-panel classes and responsive styles without changing tab semantics or counts.
- [ ] Run the focused test, full tests, lint, and production build.
- [ ] Inspect the 320px and 390px layouts for overflow and hierarchy.
- [ ] Commit and push to `main`, then verify the live Demo 5 route.
