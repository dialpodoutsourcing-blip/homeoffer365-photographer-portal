# Homeowners Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Demo 5 identity with a canonical Homeowners route while preserving the old URL as a permanent redirect.

**Architecture:** Add an App Router page at `/photographers/homeowners` that renders the existing Demo 5 experience through audience-facing Homeowners names. Convert `/photographers/demo-5` into a server-side permanent redirect so there is one canonical page.

**Tech Stack:** Next.js App Router, React, TypeScript, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-17-homeowners-route-design.md`

## Global Constraints

- The canonical URL is exactly `/photographers/homeowners`.
- The legacy `/photographers/demo-5` URL permanently redirects to the canonical URL.
- Demo 1 through Demo 4 remain unchanged.
- Shared Demo 4-derived styles and media assets are not renamed.

## Review Focus

- Direct canonical navigation renders the intended page and exports Homeowners metadata.
- Legacy navigation uses `permanentRedirect`, not a duplicate render or temporary redirect.
- No visible or metadata-level “Demo 5” identity remains on the canonical route.
- Existing Demo 4 imports and behavior remain isolated from the renamed component.
- The production build recognizes both route modules without route conflicts.

---

### Task 1: Canonical Homeowners Route and Legacy Redirect

**Files:**
- Create: `app/photographers/homeowners/page.tsx`
- Modify: `app/photographers/demo-5/page.tsx`
- Rename: `components/photographer-guide/photographer-demo-five.tsx` to `components/photographer-guide/homeowners-page.tsx`
- Modify: `tests/photographer-landing.test.mjs`

**Interfaces:**
- Consumes: the existing Demo 5 page component markup and `DemoFiveSamples` child component.
- Produces: `HomeownersPage(): JSX.Element`, canonical `/photographers/homeowners`, and permanent legacy redirect to that route.

- [ ] **Step 1: Write the failing route identity test**

Update the focused test to read the canonical and legacy route files and assert that the canonical route imports/renders `HomeownersPage`, has metadata containing `Homeowners`, contains no `Photographer Demo 5`, and that the legacy route calls `permanentRedirect("/photographers/homeowners")`. Retain the existing independence comparison with Demo 4 after normalizing the renamed component and sample import identifiers.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/photographer-landing.test.mjs`

Expected: FAIL because `app/photographers/homeowners/page.tsx` does not exist yet.

- [ ] **Step 3: Add the canonical page and rename the component**

Create `app/photographers/homeowners/page.tsx` with Homeowners metadata and `<HomeownersPage />`. Rename the existing component file and exported function to `HomeownersPage`, retaining its current markup, `DemoFiveSamples` dependency, CSS hooks, and assets.

- [ ] **Step 4: Convert the legacy route to a permanent redirect**

Replace the Demo 5 render and metadata with `permanentRedirect("/photographers/homeowners")` from `next/navigation` in the route’s default server component.

- [ ] **Step 5: Run focused verification**

Run: `node --test tests/photographer-landing.test.mjs`

Expected: PASS.

- [ ] **Step 6: Run production verification**

Run: `npm run build`

Expected: exit code 0 with both `/photographers/homeowners` and `/photographers/demo-5` accepted by Next.js.

- [ ] **Step 7: Review the scoped diff**

Run: `git diff --check` and inspect only the files listed in this task plus the approved spec and plan. Preserve all unrelated working-tree changes.
