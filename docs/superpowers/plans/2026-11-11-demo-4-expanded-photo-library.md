# Demo 4 Expanded Photo Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Demo 4 to exact, duplicate-free category totals and add a Basement gallery tab.

**Architecture:** Keep the existing tabbed gallery component and extend its typed gallery data. Generate distinct project-local WebP assets using the existing property as visual reference, then verify both manifest integrity and visual uniqueness.

**Tech Stack:** Next.js, React, TypeScript, Node test runner, built-in image generation.

**Spec:** `docs/superpowers/specs/2026-11-11-demo-4-expanded-photo-library-design.md`

## Global Constraints

- Exact totals: Exterior 12, Interior 24, Basement 8, Mechanicals 10.
- No duplicate asset paths or materially repeated viewpoints.
- Same modest red-brick bungalow; no people, text, logos, watermarks, or luxury redesign.
- Preserve unrelated worktree changes.

## Review Focus

- All manifest assets exist and are nontrivial images.
- Basement is keyboard reachable and resets the selected thumbnail.
- A single asset cannot appear in more than one gallery.
- Mechanical closeups remain distinct systems rather than duplicate angles.
- Generated scenes remain visually coherent with the existing property.

---

### Task 1: Gallery manifest and generated assets

**Files:**
- Modify: `tests/photographer-landing.test.mjs`
- Modify: `components/photographer-guide/demo-four-samples.tsx`
- Create: `public/images/photo-examples/pennsylvania-brick-bungalow/*.webp`

**Interfaces:**
- Consumes: existing Demo 4 tab and gallery structure.
- Produces: four typed galleries with exact totals and unique local image paths.

- [ ] Add a failing test for the Basement tab, exact counts, unique paths, asset existence, and asset size.
- [ ] Run the targeted test and confirm it fails for the missing Basement gallery/assets.
- [ ] Generate 29 distinct property-consistent images and save them in the property image directory.
- [ ] Add Basement to the tab/gallery types, move the basement overview, and add all new manifest entries in tour order.
- [ ] Run the targeted test and confirm it passes.
- [ ] Create and inspect category contact sheets; replace any repeated or incoherent view.
- [ ] Run the full test suite and production build.
- [ ] Commit the complete feature.
