# Demo 4 Payment Fields Design

## Intent

Collect the photographer's payment preference with every Demo 4 submission while retaining the existing contact, property, Google Drive, checklist, confirmation, and notification workflow.

## Approved approach

Add two required fields to the existing shared submission form: a native Payment Method dropdown with only Venmo and Zelle, followed by an HTTPS Payment Link input. Send both values through the existing submission API, store them in `public.photographer_submissions.payment_method` and `payment_link`, and include them in the internal notification.

The shared form is used by Demo 4 and the index landing page, so both receive the same fields. Existing database rows remain valid because the new columns are nullable at the schema level; the application requires them for new submissions.

## Constraints

- Preserve every existing field and checklist group.
- Payment method values are exactly `venmo` and `zelle`.
- Payment link must be HTTPS, have no embedded credentials, and be at most 2048 characters.
- No new dependency and no changes to Demo 5.
