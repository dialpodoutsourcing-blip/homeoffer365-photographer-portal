# AI Property Media Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's sample property media with a coherent AI-generated small Pennsylvania house, expanded mechanical coverage, and two playable property videos.

**Architecture:** Store descriptive project-local assets under a dedicated media folder, expose the stills through the existing content and Demo 4 gallery structures, and use local MP4s for the street-view and full-tour tabs. Videos are composed from generated frames because native text-to-video tooling is unavailable.

**Tech Stack:** Next.js 16.4.5, React 19.3, TypeScript, `next/image`, MP4/H.264 media, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-10-ai-property-media-refresh-design.md`

## Global Constraints

- Depict one consistent modest American house in Pennsylvania's rolling, wooded topography.
- Use no people, logos, readable text, watermarks, or luxury-home styling.
- Preserve unrelated worktree changes.
- Read relevant Next.js 16.4.5 guidance before code edits.
- Keep the disclaimer that generated examples are not inspected properties or verified installations.

## Review Focus

- Every referenced image and MP4 exists at its public path.
- Gallery labels and alternative text correctly describe each asset.
- Mechanical coverage includes six distinct systems found in a typical Pennsylvania house.
- Both videos play inline and have useful poster images and accessible labels.
- Existing responsive gallery behavior and keyboard tab navigation remain intact.

---

### Task 1: Define media contract tests

**Files:**
- Modify: `tests/photo-guide-drive-images.test.mjs`
- Modify: `tests/photographer-landing.test.mjs`

**Interfaces:**
- Consumes: current content exports and Demo 4 source text.
- Produces: assertions for the supplied asset directory, four mechanical samples, and two local video paths.

- [ ] Add failing tests requiring all new public assets, gallery references, four mechanical examples, and both MP4 sources.
- [ ] Run `npm test` and confirm the new assertions fail for missing media/references.

### Task 2: Generate coherent still assets

**Files:**
- Create: `public/images/photo-examples/pennsylvania-brick-bungalow/*`

**Interfaces:**
- Produces: descriptive exterior, interior, and mechanical JPG/PNG assets used by content data and videos.

- [ ] Import the five exterior, five interior, and four mechanical/detail images supplied by the user.
- [ ] Inspect each supplied image for subject accuracy and coherent property coverage.
- [ ] Copy final assets into the project-local media directory with stable descriptive filenames.

### Task 3: Build the two video assets

**Files:**
- Create: `public/videos/ai-pennsylvania-street-360.mp4`
- Create: `public/videos/ai-pennsylvania-property-tour.mp4`

**Interfaces:**
- Consumes: Task 2 still assets.
- Produces: browser-playable H.264 MP4 files.

- [ ] Compose the street-view sequence from exterior orbit frames with smooth motion and transitions.
- [ ] Compose the tour sequence from front exterior through key rooms, mechanical area, and rear exterior.
- [ ] Validate both files with a media probe and confirm nonzero duration, H.264 video, and 16:9 output.

### Task 4: Replace site references and expand galleries

**Files:**
- Modify: `content/photographer-guide.ts`
- Modify: `components/photographer-guide/demo-four-samples.tsx`
- Modify: `components/photographer-guide/photo-slider.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: Task 2 image paths and Task 3 video paths.
- Produces: updated galleries, hero backgrounds, posters, labels, and accessible video elements.

- [ ] Update central gallery/category data to the supplied media set and four mechanical examples.
- [ ] Replace Demo 4's Street View iframe with the local 360-style video and replace its property-tour source.
- [ ] Update the slider and hero CSS references so targeted samples use the coherent house.
- [ ] Run targeted tests and confirm all Task 1 assertions pass.

### Task 5: Verify, report, commit, and push

**Files:**
- Modify only if verification reveals a scoped issue.

**Interfaces:**
- Consumes: complete Tasks 1-4.
- Produces: verified commit on the current branch and a successful upstream push.

- [ ] Run `npm test`, `npm run lint`, `npm run build`, and `npm run build:standalone`.
- [ ] Run the Next.js agent-feedback reporting pass if qualifying feedback candidates exist.
- [ ] Review `git diff` and stage only intended work plus the required AGENTS.md state.
- [ ] Commit with a descriptive message and push the current branch to its configured upstream.
