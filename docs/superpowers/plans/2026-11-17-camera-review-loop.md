# Camera Review Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-camera Retake/Use Photo check after every shutter tap without closing the live stream.

**Architecture:** Extend `DemoFiveLiveCamera` with a captured-file review state while retaining ownership of the existing MediaStream. The component creates and cleans a local preview URL; only Use Photo invokes the existing form persistence callback.

**Tech Stack:** React 19, TypeScript, Media Capture and Streams API, Canvas API, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-17-camera-review-loop-design.md`

## Global Constraints

- Camera stream remains active through live, review, and save states.
- Retake never invokes persistence.
- Use Photo invokes persistence exactly once per accepted frame.
- Failed saves retain the preview for retry or retake.
- Object URLs and camera tracks are always cleaned up.

## Review Focus

- Rapid Use Photo taps cannot duplicate a saved image.
- Retake during or after a failed save never saves the rejected frame.
- Successful save revokes the preview URL before returning live.
- Closing during review revokes the preview and stops every track.
- Camera errors preserve the Upload Photos fallback.

### Task 1: Review-state camera

**Files:**
- Modify: `components/photographer-guide/demo-five-live-camera.tsx`
- Modify: `app/globals.css`
- Modify: `tests/demo-five-live-camera.test.mjs`

- [ ] Add failing component tests for captured preview, Retake, Use Photo, failed-save retry, serialization, and cleanup.
- [ ] Run the focused test and verify RED.
- [ ] Implement the live/review/saving state machine with exact labels **Retake** and **Use Photo**.
- [ ] Run the focused test and verify GREEN.

### Task 2: Regression and release

**Files:**
- Modify: `tests/demo-five-photo-form.test.mjs` only if the integration contract changes.

- [ ] Verify approved frames still use the existing selected-category persistence callback.
- [ ] Run `npm test`, `npm run build`, and `git diff --check`.
- [ ] Commit, push to `main`, and verify the deployed client asset contains Retake and Use Photo.
