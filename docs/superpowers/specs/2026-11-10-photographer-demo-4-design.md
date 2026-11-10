# Photographer Demo 4 Design

## Intent

Create a separate `/photographers/demo-4` landing page that compresses the photographer guidance and submission flow into a very simple page intended to take roughly one or two desktop scrolls.

## Goals

- Keep Demo 3 unchanged.
- Lead with a house-only Home Offer 365 mark and “Welcome to Home Offer 365.”
- Link “Meet the Team” to the public website and provide a clear “Easy Exit” link.
- Show five concise public vendor/homeowner reviews with visible avatar treatments and a Google reviews link.
- Present photo and video examples for exterior photography, 360/street view, exterior video, interior video, living room, kitchen, bathroom, and mechanicals without long instructional copy.
- End with the existing photographer information and photo/video submission form.
- Keep the result a conventional landing page, not a dashboard.

## Non-goals

- Do not alter Demo 3, the production photographer route, or the existing submission behavior.
- Do not add a live review API or a new submission backend.
- Do not reproduce the full navigation, footer, long checklist, or full team roster from Demo 3.

## Constraints

- Use the installed Next.js 16.4.5 App Router conventions documented in `node_modules/next/dist/docs/`.
- Keep review content static and attributable to public Home Offer 365 review material; link users to Google for the source page.
- Use resilient local avatar artwork when a public reviewer profile photo cannot be stored reliably.
- Preserve unrelated dirty-worktree changes, especially existing edits in `app/globals.css`.

## Approaches

1. Add another variant to the large shared Demo 3 component. This reuses markup but creates extensive variant branches and makes the short-page constraint harder to maintain.
2. Build a dedicated Demo 4 landing component and route while reusing the existing submission form and approved media assets. Selected because it keeps Demo 4 structurally short and leaves Demo 3 untouched.
3. Turn the content into a dashboard of cards and controls. Rejected because the requested experience is a page, not a dashboard.

## Selected Design

Demo 4 is a focused landing page with four shallow bands: a compact brand/exit header and welcome hero; a five-review strip; a visual sample grid with the requested photo/video labels; and the existing submission form under a “Photographer’s Info” heading. The page uses concise copy, dense spacing, and horizontally arranged content on desktop, while stacking cleanly on small screens. Sample videos open through native controls and photo examples use the existing property assets.

## Verification

- Add a regression test that fails until the new route, dedicated component, exact required labels, five reviews, local avatars, and compact styling hooks exist.
- Confirm Demo 3 still renders its existing shared component and does not reference Demo 4.
- Run the focused test, full test suite, lint, and production build.

