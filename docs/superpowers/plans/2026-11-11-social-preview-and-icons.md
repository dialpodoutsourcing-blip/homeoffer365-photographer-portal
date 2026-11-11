# Social Preview and Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a branded social-link thumbnail and standard site icons for the Demo 4 homepage.

**Architecture:** Next.js metadata image routes will generate the Open Graph, Twitter/X, browser, and Apple images at build time. The routes will reuse the existing local Demo 4 hero and official Home Offer 365 logo, while the root metadata supplies current preview copy and an absolute production base URL.

**Tech Stack:** Next.js 16 App Router, `next/og` ImageResponse, TypeScript, Node test runner

**Spec:** `docs/superpowers/specs/2026-11-11-social-preview-and-icons-design.md`

## Global Constraints

- Open Graph and Twitter/X preview size is exactly 1200×630.
- Use existing local Home Offer 365 logo and Demo 4 property imagery.
- Do not change Demo 4 page content, routes, galleries, or videos.
- Generated assets must remain within social-platform size limits.

## Review Focus

- Slackbot must receive absolute, crawlable image metadata rather than a relative or missing image URL.
- The preview must show current Demo 4 title/description rather than the superseded photographer resource page copy.
- Local assets must resolve during Vercel production builds regardless of the build working directory.
- Generated icon routes must declare correct dimensions and content types.
- The Open Graph composition must remain readable when reduced to a compact messaging-app card.

---

### Task 1: Add branded metadata images and icons

**Files:**
- Create: `app/opengraph-image.tsx`
- Create: `app/twitter-image.tsx`
- Create: `app/icon.tsx`
- Create: `app/apple-icon.tsx`
- Modify: `app/layout.tsx`
- Modify: `tests/photographer-landing.test.mjs`

**Interfaces:**
- Consumes: `public/images/brand/home-offer-365-logo.png` and `public/images/photo-examples/demo-4-photographer-hero.webp`
- Produces: Next.js metadata image routes and absolute root social metadata

- [ ] **Step 1: Write the failing metadata-image regression test**

Assert that the four metadata routes exist; Open Graph/Twitter routes export 1200×630 PNG metadata and current preview text; icon routes export 32×32 and 180×180 PNG metadata; and root layout exports the production `metadataBase`, current Demo 4 title/description, Open Graph, and Twitter card settings.

- [ ] **Step 2: Verify the regression test fails**

Run: `node --test tests/photographer-landing.test.mjs`

Expected: FAIL because metadata image route files do not exist.

- [ ] **Step 3: Implement the metadata image routes and root metadata**

Use `ImageResponse` with local file reads anchored to `process.cwd()`. Build a legible branded property card for Open Graph and reuse it from the Twitter route. Build simple logo-based 32×32 and 180×180 icons. Set `metadataBase` to `https://photographer.homeoffer365.com` and use current Demo 4 preview copy.

- [ ] **Step 4: Verify behavior and build output**

Run: `npm test`

Expected: all tests pass.

Run: `npm run build`

Expected: successful production build with `/opengraph-image`, `/twitter-image`, `/icon`, and `/apple-icon` generated.

- [ ] **Step 5: Inspect the generated social image**

Render or request the generated Open Graph image, confirm it is a valid 1200×630 PNG, and visually inspect that the logo, title, and property image are legible with no clipping.

- [ ] **Step 6: Commit and deploy**

Commit only the spec, plan, metadata code, and regression tests; fast-forward `main`; rerun tests; and push to trigger Vercel.
