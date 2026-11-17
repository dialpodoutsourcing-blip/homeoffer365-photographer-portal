# Streamlined Homeowners Page Design

## Intent

Turn `/photographers/homeowners` into a short, homeowner-facing property-photo submission page. Remove every visible photographer/vendor cue and place the preserved photo workflow directly beneath a compact hero.

## Goals

- Replace the photographer hero with a shallow homeowner hero using the existing brick-home exterior image.
- Use the approved hero copy:
  - Eyebrow: `HOMEOWNER PHOTO PORTAL`
  - Heading: `Share Your Property Photos`
  - Body: `Upload clear photos of your home so our team can review the property and keep your sale moving.`
- Remove the team strip, vendor reviews, and quick-reference samples from the Homeowners page.
- Keep the secure photo capture, local draft, retry, upload, and submission behavior.
- Reduce the form from three steps to two: homeowner information, then property photos.
- Change visible `Photographer's Name` copy to `Homeowner's Name` and remove all payment fields and payment validation.
- Preserve prior submissions and saved drafts safely.

## Non-goals

- Do not change Demo 1 through Demo 4.
- Do not redesign the photo checklist, editor, upload transport, rate limiting, or confirmation dialog.
- Do not rename legacy database tables, foreign keys, API paths, internal storage keys, or TypeScript modules in this pass; those names are invisible to homeowners and broad renaming would increase migration risk.
- Do not delete historical payment values.

## Page Design

The page contains only two major regions:

1. A compact hero with the Home Offer 365 logo, a short dark overlay, and `public/images/photo-examples/pennsylvania-brick-bungalow/exterior-front-left-curb.webp`. Desktop height should remain near 240px and mobile near 210px so the form begins close to the top of the page.
2. The existing photo workflow, introduced by `Your property photo checklist`, with no redundant outer `Photographer's Info` heading.

The Homeowners component receives its own scoped class hooks so shortening this hero does not alter Demo 4.

## Form and Domain Behavior

The wizard becomes `WizardStep = 1 | 2`:

- Step 1: Homeowner's Name, email, and phone.
- Step 2: Property address and the existing property-photo checklist/editor.

Draft restoration should route incomplete contact details to Step 1 and any draft containing an address or photos to Step 2. Existing drafts that still contain payment fields remain readable; those legacy values are ignored for new validation and are not displayed.

At the public submission boundary, the normalized contact object contains only name, email, and phone. Error messages refer to homeowner/contact details rather than photographer or payment details. The prepare/finalize retry and idempotency behavior remains unchanged.

## Data Compatibility

Add a forward-only Supabase migration that makes `public.photographers.payment_method` and `public.photographers.payment_url` nullable. Keep the columns and existing values so historical data is preserved. New homeowner submissions write `null` for both fields through the existing persistence boundary.

This is preferred over hidden placeholder values because the database truthfully records that no payment information was collected, and over renaming the existing tables because the latter would touch substantially more security and upload infrastructure without changing the homeowner experience.

## Testing and Verification

- Page tests assert the compact homeowner hero copy/image and absence of team, vendor-review, quick-reference, sample-gallery, and photographer-facing copy.
- Wizard tests assert two steps, homeowner labeling, no payment controls, correct draft restoration, and unchanged photo workflow behavior.
- Workflow/API tests assert valid submissions need only name, email, phone, address, and photos; payment values are neither accepted as required input nor returned as normalized contact data.
- Schema/service tests assert the migration preserves old payment values and permits new contacts with null payment columns.
- Run the complete test suite and production build, then verify the canonical live route and legacy redirect.

## Approaches Considered

1. **Make payment optional end-to-end (selected).** Honest data, safe historical preservation, and no homeowner payment UI.
2. **Hide payment controls and send placeholders.** Rejected because it stores misleading payment data.
3. **Rename the entire photographer domain and schema.** Deferred because it is much larger and riskier than the homeowner-facing change requires.
