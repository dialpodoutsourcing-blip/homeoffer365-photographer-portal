# Demo 4 Remotion Interior Walkthrough Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and install a clean, no-people, 55–65 second Remotion interior walkthrough for Demo 4.

**Architecture:** Generate a consistent sequence of photorealistic room scenes, animate each as a camera segment in a dedicated Remotion composition, and render a web MP4 plus poster into the existing public asset paths. Keep the Remotion source separate from the Next.js app while allowing deterministic rerenders.

**Tech Stack:** Remotion, React, TypeScript, generated raster images, FFmpeg/Remotion renderer, Next.js static assets

**Spec:** `docs/superpowers/specs/2026-11-11-demo-4-remotion-interior-walkthrough-design.md`

## Global Constraints

- Output duration must be between 55 and 65 seconds at 30 fps in 16:9.
- Show entry, living room, dining area, kitchen, hallway, primary bedroom, second bedroom, bathroom, and laundry/utility area.
- Show no people, captions, logos, voice-over, or visible camera operator.
- Preserve Demo 4's exterior walkthrough and all unrelated worktree changes.
- Keep the property modest, clean, lightly staged, and visually consistent.

## Review Focus

- Scene mismatch: adjacent rooms must retain the same flooring, trim, wall color, daylight, and furnishing language.
- Motion discomfort: movement must remain slow and eased without abrupt zooms or whip transitions.
- Coverage: every required interior area must appear long enough to understand it.
- Web playback: rendered MP4 must use a browser-compatible codec and practical bitrate.
- Integration: Demo 4 must reference the replacement interior asset while the exterior source remains unchanged.

---

### Task 1: Generate and validate the room sequence

**Files:**
- Create: `public/images/photo-examples/demo-4-walkthrough/*.png`

**Interfaces:**
- Produces: nine ordered 16:9 room images consumed by the Remotion composition.

- [ ] Generate the entry and living-room establishing scene with the full shared house style.
- [ ] Generate each subsequent room using the established scene as continuity reference.
- [ ] Visually inspect all outputs for people, structural contradictions, clutter, text, and inconsistent finishes.
- [ ] Retain only the nine approved project assets in walkthrough order.

### Task 2: Build the Remotion composition

**Files:**
- Create: `remotion/index.ts`
- Create: `remotion/Root.tsx`
- Create: `remotion/Demo4InteriorWalkthrough.tsx`
- Create: `remotion/walkthrough-manifest.ts`
- Create: `tests/demo-4-remotion-walkthrough.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: ordered room images from Task 1.
- Produces: composition id `Demo4InteriorWalkthrough`, 1920×1080, 30 fps, 1800 frames.

- [ ] Write a failing manifest test asserting the exact nine-scene order, 1800 total frames, no overlays, and existing source images.
- [ ] Run `node --test tests/demo-4-remotion-walkthrough.test.mjs` and verify it fails before implementation.
- [ ] Add only the Remotion dependencies and render scripts required by the composition.
- [ ] Implement the typed manifest and composition with eased push/slide motion and soft doorway-style transitions.
- [ ] Run the manifest test and TypeScript/lint checks until they pass.

### Task 3: Render and integrate the replacement

**Files:**
- Replace: `public/videos/demo-4-interior-walkthrough.mp4`
- Replace: `public/images/photo-examples/demo-4-interior-walkthrough-poster.jpg`
- Verify: `app/photographers/demo-4/page.tsx`

**Interfaces:**
- Consumes: composition id `Demo4InteriorWalkthrough`.
- Produces: browser-ready MP4 and poster at the existing Demo 4 asset URLs.

- [ ] Render the MP4 with H.264 and a web-practical quality setting.
- [ ] Render or extract a representative living-room poster frame.
- [ ] Verify dimensions, duration, codec, frame rate, file size, and absence of audio.
- [ ] Confirm Demo 4 references the replacement interior URL and unchanged exterior URL.
- [ ] Run targeted tests, lint, and production build.
- [ ] Review the rendered video visually and correct any jarring motion or scene issue.
- [ ] Commit only the walkthrough work without absorbing unrelated worktree changes.
