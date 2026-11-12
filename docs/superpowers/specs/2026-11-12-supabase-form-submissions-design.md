# Supabase Form Submissions Design

## Intent

Persist the public photographer submission form in Supabase without requiring visitors to create accounts or sign in.

## Constraints

- Keep the Supabase service-role key on the server only.
- Preserve the existing form fields and Google Drive URL validation.
- Do not expose saved names, emails, phone numbers, addresses, or Drive links to anonymous clients.
- Show honest pending, success, configuration-error, validation-error, and database-error states.

## Approaches

- Direct anonymous browser inserts: fewer server files, but exposes a general-purpose insert path and requires an anonymous table policy.
- Next.js route handler with a server-only service-role key: selected because it keeps privileged credentials and database writes behind validation while requiring no visitor authentication.

## Design

The client posts JSON to `POST /api/submissions`. A focused submission module normalizes and validates the five fields, accepts only HTTPS Google Drive or Google Docs links, and inserts one row through a server-created Supabase client. The route returns stable JSON responses and never exposes database errors or credentials. The table uses row-level security with no anonymous policies; only the server-side service-role request bypasses RLS. The form disables duplicate submissions while pending and only shows confirmation after the route succeeds.

## Database

Create `public.photographer_submissions` with UUID identity, contact/property/link columns, a checklist-complete boolean, and `created_at`. Add length and URL checks, enable RLS, and revoke access from `anon` and `authenticated`.

## Environment

The server requires `SUPABASE_URL` and `SB_SECRET` (containing the current `sb_secret_...` key type). `SUPABASE_PUBLISHABLE_KEY` may remain configured but is not used by this public form.
