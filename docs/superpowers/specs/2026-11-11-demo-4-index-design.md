# Demo 4 Index Design

## Intent

Make Demo 4 the first page visitors see at the site root while keeping the clean `/` URL and preserving `/photographers/demo-4`.

## Approach

Render the existing `PhotographerDemoFour` component from `app/page.tsx` and give the root page the same public-facing metadata as Demo 4. A redirect was considered but rejected because it would expose the longer demo URL. No components, assets, or secondary routes change.

## Verification

Add a regression assertion that the root page imports and renders `PhotographerDemoFour`, then run the full test suite and production build.
