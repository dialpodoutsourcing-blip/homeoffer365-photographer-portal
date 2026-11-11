# Demo 4 Exterior Walkthrough Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Demo 4's subtle exterior video with a smooth image-based walkthrough whose stronger forward zoom clearly feels like walking around the property.

**Architecture:** Add a dedicated exterior Remotion manifest and composition beside the existing interior composition. Render the six existing exterior images at 1920×1080 with a `1.04` to `1.20` smooth push-in, restrained directional drift, and covered crossfades.

**Tech Stack:** Remotion 4.0.542, React 19, Node test runner, Next.js 16

**Spec:** `docs/superpowers/specs/2026-11-11-demo-4-exterior-walkthrough-motion-design.md`

## Global Constraints

- Use only the existing Demo 4 exterior property images.
- Replace only the exterior walkthrough MP4 and poster; preserve the interior walkthrough and page layout.
- Scale each scene smoothly from approximately `1.04` to `1.20`.
- Produce a web-friendly H.264/YUV420p MP4 without overlays or black edges.

## Review Focus

- Every exterior source image exists before rendering.
- Scene durations sum exactly to the composition duration.
- Crossfades never expose an uncovered frame.
- Scale endpoints remain exactly `1.04` and `1.20` so motion cannot regress to subtle.
- Rendered media stays within existing automated web-size bounds and remains referenced by Demo 4.

---

### Task 1: Exterior Remotion composition and rendered media

**Files:**
- Create: `remotion/exterior-walkthrough-manifest.mjs`
- Create: `remotion/Demo4ExteriorWalkthrough.tsx`
- Modify: `remotion/Root.tsx`
- Modify: `remotion/package.json`
- Modify: `tests/demo-4-remotion-walkthrough.test.mjs`
- Replace: `public/videos/demo-4-exterior-walkthrough.mp4`
- Replace: `public/images/photo-examples/demo-4-exterior-walkthrough-poster.jpg`

**Interfaces:**
- Consumes: six existing images under `public/images/photo-examples/pennsylvania-brick-bungalow/`.
- Produces: `EXTERIOR_WALKTHROUGH_SCENES`, `EXTERIOR_TOTAL_FRAMES`, `EXTERIOR_START_SCALE`, `EXTERIOR_END_SCALE`, and `Demo4ExteriorWalkthrough`.

- [ ] **Step 1:** Add failing tests for the ordered six-image route, source existence, exact duration, covered crossfades, no overlays, and scale constants `1.04` and `1.20`.
- [ ] **Step 2:** Run `node --test tests/demo-4-remotion-walkthrough.test.mjs` and verify RED because the exterior manifest is missing.
- [ ] **Step 3:** Implement the exterior manifest/composition, register it in `Root.tsx`, and add exterior render/poster scripts.
- [ ] **Step 4:** Run the focused test and `npm run typecheck --prefix remotion`; expect PASS.
- [ ] **Step 5:** Render the MP4 and poster and inspect opening, middle, and closing frames.
- [ ] **Step 6:** Run `npm test` and `npm run build`; expect PASS.
- [ ] **Step 7:** Commit and push the focused change to `main`.
