# Demo 4 Interior Coverage and Video Walkthroughs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Demo 4's interior gallery and change its existing video-tour presentation into separate exterior and interior video walkthroughs.

**Architecture:** Keep gallery and video configuration local to `DemoFourSamples`. Generate four coherent static assets, reuse verified continuous project-local MP4 footage, and protect exact category order and terminology with source-level regression tests.

**Tech Stack:** Next.js 16.4.5, React 19, TypeScript, `next/image`, native HTML video, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-11-demo-4-interior-and-walkthroughs-design.md`

## Global Constraints

- Limit changes to Demo 4, its media assets, tests, and approved documentation.
- Keep the existing video feature; rename and split its presentation into video walkthroughs.
- New stills must match the Pennsylvania bungalow and contain no people, text, logos, or watermarks.
- Use continuous project-local MP4 footage, not the AI property slideshow.
- Preserve all unrelated working-tree changes.

## Review Focus

- Kitchen and bathroom under-sink images are distinct and correctly labeled.
- Interior ordering follows a believable room-to-room path.
- Exactly two separately playable walkthrough video elements render.
- No Demo 4 user-facing "Video Tour" wording remains.
- Mobile gallery/video layout still supports the longer content list.

---

### Task 1: Pin the new Demo 4 requirements

**Files:**
- Modify: `tests/photographer-landing.test.mjs`

**Interfaces:**
- Consumes: `components/photographer-guide/demo-four-samples.tsx` source and project-local media paths
- Produces: Failing regression assertions for interior order, files, two video elements, and terminology

- [ ] Add a test asserting the exact ten-image Interior order: living room, dining area, hallway/layout, kitchen, kitchen under-sink, primary bedroom, second bedroom, bathroom, bathroom vanity plumbing, laundry.
- [ ] Assert the four new image files exist and are non-empty.
- [ ] Assert the tab is `Video Walkthroughs`, the panel has exactly two walkthrough video elements, and labels are `Exterior Video Walkthrough` and `Interior Video Walkthrough`.
- [ ] Assert Demo 4 contains no `Video Tours`, `Full Property Video Tour`, or user-facing `video tour` wording.
- [ ] Run `node --test tests/photographer-landing.test.mjs` and confirm the new test fails for missing assets and old terminology.

### Task 2: Generate the four missing interior views

**Files:**
- Create: `public/images/photo-examples/pennsylvania-brick-bungalow/interior-dining-area.png`
- Create: `public/images/photo-examples/pennsylvania-brick-bungalow/interior-hallway-layout.png`
- Create: `public/images/photo-examples/pennsylvania-brick-bungalow/interior-second-bedroom.png`
- Create: `public/images/photo-examples/pennsylvania-brick-bungalow/interior-bathroom-vanity-plumbing.png`

**Interfaces:**
- Consumes: Existing bungalow interior images as identity/style references
- Produces: Four project-local landscape MLS-style images for Task 4

- [ ] Generate each asset with room-specific framing and strict property/style invariants.
- [ ] Inspect each generated output for property consistency, correct subject, plumbing realism, and prohibited content.
- [ ] Save selected outputs at the exact paths above.

### Task 3: Select continuous walkthrough footage

**Files:**
- Inspect: `public/videos/demo-4-property-tour.mp4`
- Inspect: `public/videos/interior-sample.mp4`
- Inspect: `public/videos/mt-vernon-walkthrough.mp4`

**Interfaces:**
- Produces: Two verified project-local MP4 paths, one exterior and one interior, for Task 4

- [ ] Extract representative frames from candidate videos using a temporary media-inspection tool without changing dependencies.
- [ ] Select continuous-motion exterior and interior clips that best match their labels.
- [ ] Record a ruling if existing footage cannot cleanly satisfy one label; do not substitute the AI slideshow.

### Task 4: Update Demo 4 gallery and video walkthroughs

**Files:**
- Modify: `components/photographer-guide/demo-four-samples.tsx`
- Test: `tests/photographer-landing.test.mjs`

**Interfaces:**
- Consumes: Four image paths from Task 2 and two MP4 paths from Task 3
- Produces: Updated Demo 4 gallery and separately playable walkthrough presentation

- [ ] Add the ten interior entries in the approved room-to-room order with distinct kitchen and bathroom plumbing labels.
- [ ] Change the tab to `Video Walkthroughs`.
- [ ] Render two native video articles labeled `Exterior Video Walkthrough` and `Interior Video Walkthrough`, each with its own source, poster, accessible label, and continuous-motion description.
- [ ] Run the focused test and confirm it passes.

### Task 5: Verify, review, commit, and publish

**Files:**
- Verify all files changed by Tasks 1–4.

**Interfaces:**
- Consumes: Complete implementation
- Produces: Verified commits on remote `main`

- [ ] Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check`.
- [ ] Review the complete diff against the spec and correct Critical/Important findings with RED→GREEN tests.
- [ ] Run the Next.js agent-feedback reporting pass only if qualifying framework feedback candidates remain.
- [ ] Commit implementation and documentation without staging unrelated changes.
- [ ] Push `main` and verify local and remote commit hashes match.
