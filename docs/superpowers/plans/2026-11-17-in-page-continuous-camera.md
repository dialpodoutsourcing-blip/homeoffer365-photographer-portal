# In-Page Continuous Camera Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the homeowner's rear camera open so every shutter tap automatically saves another photo.

**Architecture:** A focused client camera component owns `getUserMedia`, video/canvas frame capture, shutter serialization, and stream cleanup. The existing homeowner form owns category selection and persists each returned `File` through its tested automatic-photo pipeline.

**Tech Stack:** Next.js 16.4.5, React 19, TypeScript, Media Capture and Streams API, Canvas API

**Spec:** `docs/superpowers/specs/2026-11-17-in-page-continuous-camera-design.md`

## Global Constraints

- Rear-facing camera is preferred; audio is never requested.
- Camera remains open across successful captures.
- Each shutter tap completes automatic local persistence before another is accepted.
- Closing or unmounting stops all media tracks.
- Upload Photos remains the fallback.

## Review Focus

- Permission denial produces an actionable fallback without an unhandled rejection.
- Double taps cannot create overlapping saves.
- Zero-sized/unready video frames cannot be saved.
- Closing during capture stops tracks without updating an unmounted component.
- Reopening requests a fresh stream and does not reuse stopped tracks.

### Task 1: Live camera component

**Files:**
- Create: `components/photographer-guide/demo-five-live-camera.tsx`
- Create: `lib/demo-five/live-camera.ts`
- Test: `tests/demo-five-live-camera.test.mjs`

- [ ] Write failing tests for frame-to-file conversion, invalid video dimensions, track cleanup, rear-camera constraints, and serialized shutter state.
- [ ] Run the focused test and verify RED.
- [ ] Implement the helper and accessible camera overlay.
- [ ] Run the focused test and verify GREEN.

### Task 2: Form integration and release

**Files:**
- Modify: `components/photographer-guide/demo-five-submission-form.tsx`
- Modify: `app/globals.css`
- Modify: `tests/demo-five-photo-form.test.mjs`

- [ ] Write failing form assertions proving Take Photos opens the live camera and no capture file input remains.
- [ ] Run the form test and verify RED.
- [ ] Route each live-camera `File` through the selected category's existing automatic-save path and keep Upload Photos unchanged.
- [ ] Run focused tests, full `npm test`, `npm run build`, and route checks.
- [ ] Commit and publish the verified change.
