# Social Preview and Icons Design

## Intent

Give shared links a recognizable Home Offer 365 thumbnail instead of a blank placeholder, and provide standard browser and mobile icons.

## Goals

- Generate a 1200×630 Open Graph image that combines the existing Demo 4 property hero with clear Home Offer 365 branding.
- Use the same branded image for Twitter/X link previews.
- Provide a simple logo-based browser icon and Apple touch icon.
- Ensure root metadata describes the current Demo 4 homepage.

## Non-goals

- Do not change Demo 4 page content, routes, galleries, or videos.
- Do not redesign the Home Offer 365 logo.

## Approach

Use Next.js 16 metadata image routes (`opengraph-image.tsx`, `twitter-image.tsx`, `icon.tsx`, and `apple-icon.tsx`) so the images are generated at build time from existing local brand and property assets. This was selected over reusing the property photo alone because the branded card will remain identifiable in compact Slack previews, and over static duplicate files because generated routes keep sizing and metadata explicit.

## Verification

Regression tests will assert the metadata-image routes, dimensions, alt text, and current root copy. The full test suite and production build must pass, and the generated routes must appear in the build output.
