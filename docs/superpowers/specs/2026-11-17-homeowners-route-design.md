# Homeowners Route Design

## Intent

Rename the page currently known as Photographer Demo 5 to Homeowners so it has a stable, audience-facing name while changes continue.

## Goals

- Make `/photographers/homeowners` the canonical page.
- Use “Homeowners” in the page metadata and component naming instead of “Demo 5.”
- Preserve existing `/photographers/demo-5` links with a permanent redirect to the canonical route.
- Leave Demo 1 through Demo 4 unchanged.

## Non-goals

- Do not redesign or rewrite the page content in this change.
- Do not rename shared Demo 4-derived CSS classes or media assets.

## Approach

The canonical page will live at `app/photographers/homeowners/page.tsx` and render a renamed `HomeownersPage` component. The legacy Demo 5 page will use Next.js `permanentRedirect` to send visitors to `/photographers/homeowners`. This is preferred over deleting the old route because existing bookmarks continue to work, and over duplicating both pages because it establishes one canonical URL.

## Verification

Automated route-source tests will assert the canonical metadata/component and the legacy permanent redirect. The focused test suite and production build will verify the route compiles without changing Demo 1–4.
