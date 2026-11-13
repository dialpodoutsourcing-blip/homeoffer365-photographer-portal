# Demo 5 N/A Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all Exterior N/A options while retaining Interior N/A choices for Basement, Attic, and Garage.

**Architecture:** Update the shared `OPTIONAL_FEATURES` domain constant so UI and application validation stay aligned. Preserve camera/gallery inputs and all submission behavior.

**Tech Stack:** TypeScript, React 19, Node test runner, Next.js 16.

**Spec:** `docs/superpowers/specs/2026-11-13-demo-5-na-rules-design.md`

## Global Constraints

- Exterior, Mechanical, and Condition expose no N/A choices.
- Interior exposes exactly Basement, Attic, and Garage as N/A choices.
- `Take Photo` retains `capture="environment"`; `Choose Image` retains the non-capture file input.
- No API, database, Storage, minimum-count, labeling, or Demo 4 changes.

## Review Focus

- Exterior cards must not render an N/A disclosure.
- Interior must render exactly three optional feature checkboxes.
- Application validation must reject legacy/spoofed Exterior N/A payloads.
- Existing Interior N/A draft values must remain valid.
- Camera and gallery input attributes must remain distinct.

---

### Task 1: Align N/A configuration and UI

**Files:**
- Modify: `lib/demo-five/photo-workflow.ts`
- Modify: `tests/demo-five-photo-workflow.test.mjs`
- Modify: `tests/demo-five-photo-form.test.mjs`

**Interfaces:**
- Produces: `OPTIONAL_FEATURES.exterior = []`, `interior = ["basement", "attic", "garage"]`, with empty Mechanical and Condition arrays.

- [ ] Add failing tests for the exact optional-feature map, rejected Exterior N/A manifests, absent Exterior disclosure, and three Interior choices.
- [ ] Run focused tests and verify they fail for current Exterior Roof/Outbuildings options.
- [ ] Remove Exterior options from `OPTIONAL_FEATURES`; do not change capture inputs or photo types.
- [ ] Run focused tests, full tests, lint, build, and phone-width browser verification.
- [ ] Commit `fix: require exterior photos in demo 5`.
