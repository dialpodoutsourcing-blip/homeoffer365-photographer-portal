# POV Walkthrough Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Re-render both one-minute Demo 4 tours with continuous first-person walking motion and complete property coverage.

**Architecture:** Add shared deterministic walking-motion helpers to the Remotion manifests. Apply linear forward scale, step-frequency bob, and restrained sway to both compositions; expand exterior coverage with existing mechanical views and re-render both media assets.

**Tech Stack:** Remotion 4.0.542, React 19, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-11-pov-walkthrough-motion-design.md`

## Task 1: Walking motion and complete routes

- [ ] Add failing tests for one-minute durations, complete ordered routes, strong scale endpoints, and non-zero walking bob/sway.
- [ ] Implement shared deterministic motion helpers and apply them to both compositions.
- [ ] Expand the exterior route with the existing AC and electrical views.
- [ ] Typecheck, render both videos/posters, and inspect opening/middle/ending frames.
- [ ] Run the complete tests and production build.
- [ ] Commit, review, merge, and push to `main`.
