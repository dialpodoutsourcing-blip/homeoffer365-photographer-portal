# Resend Submission Notifications Design

## Intent

Notify the Home Offer 365 team when the public photographer form is successfully persisted, without allowing an email outage to make a saved submission appear unsuccessful.

## Goals

- After a valid row is inserted into `public.photographer_submissions`, send one transactional email through Resend.
- Send to `info@michaelpid.com` and CC `dialpodoutsourcing@gmail.com` from `Home Offer 365 Photographer Portal <notifications@send.homeoffer365.com>`.
- Include the normalized submission fields and submission time in readable HTML and plain text.
- Keep `RESEND_API_KEY` server-only and never log submission details on delivery failure.
- Treat missing Resend configuration or a Resend failure as a successful form submission when the database insert succeeded.

## Non-goals and constraints

- Supabase remains the source of truth; invalid requests and failed inserts still return errors.
- No retry queue, delivery-status table, scheduled job, new form fields, or browser-side email code.
- Use Resend's HTTPS API directly rather than adding a package dependency.
- The existing Supabase GHL trigger and trigger function must be removed separately in the hosted database.

## Approaches

- **Selected: best-effort email after persistence.** It is simple, waits for a definitive Resend result, and preserves successful submissions when email is unavailable.
- Fire-and-forget delivery was rejected because serverless execution may stop after returning the response.
- A database outbox was deferred because retries and scheduled processing are outside this scope.

## Implementation shape

Add a focused notification module that formats and sends the Resend request through an injectable fetch boundary. Extend the submission route handler so persistence completes first and notification errors are caught and logged without PII. Add `RESEND_API_KEY` to the documented server-only environment variables and cover payload, ordering, missing-key, and failure behavior with Node tests.
