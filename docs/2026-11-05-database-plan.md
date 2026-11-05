# Supabase setup and private property visit runbook

Date: November 5, 2026 (America/New_York)

Current design: public guide, staff-managed visits, and expiring private photographer links. Photographers do not enter an email/password or register. Supabase creates a background anonymous session to enforce property-scoped permissions.

Status: Code and both migrations are prepared locally. The agent has not inspected or changed your hosted project's schema, Auth settings, staff membership, or data. Your existing .env.local is preserved. Hosted Auth/Storage/CAPTCHA and browser verification are required before launch.

## Database and resources

- Suggested development project: `homeoffer365-photographer-portal-dev`.
- Managed PostgreSQL database: `postgres` (Supabase default). Do not run CREATE DATABASE.
- Application schema: `public`.
- Private Storage bucket: `property-media`.
- Production should use its own Supabase project.

## 1. Apply the migrations

In your Supabase project's SQL Editor:

1. For a new database, run the complete `supabase/migrations/202611050001_photographer_portal.sql` once.
2. Then run the complete `supabase/migrations/202611050002_private_visit_links.sql` once.
3. If you already ran 001, run **only 002** now. Do not rerun 001 or replace it with 002.

Both files are transactional. A conflict fails rather than silently overwriting existing tables. Keep later changes in new migrations. Applying 002 preserves existing assignments, checklist answers, and media; it changes their authorization and adds link-management tables/functions. Do not enable guest access until 002 is applied.

| Table | Purpose |
| --- | --- |
| assignments | Staff owner, full address, checklist v1 responses, notes, draft/submitted status, revision, timestamps |
| checklist_template_items | Immutable version-one definition of all 19 items and allowed N/A exceptions |
| portal_staff | Explicit staff membership, managed only by the project owner |
| visit_links | Property-scoped SHA-256 token hashes, expiry and revocation metadata |
| visit_guest_grants | Background guest identities that redeemed a specific link |

Staff manage only the visits they own. Staff access is checked both in the UI and by database permissions. Guests cannot create visits, promote themselves, read token hashes, mint/revoke links, or access another visit without a valid grant for it. There is no public table-writing grant to anonymous public-key requests.

Check setup:

```sql
select current_database(); -- postgres
select count(*) from public.checklist_template_items where version = 1; -- 19
select tablename, rowsecurity from pg_tables
where schemaname = 'public'
and tablename in ('assignments','checklist_template_items','portal_staff','visit_links','visit_guest_grants');
-- All five must have rowsecurity = true.
select id, public, file_size_limit from storage.buckets where id = 'property-media';
-- public = false; file_size_limit = 52428800
```

## 2. Create and authorize the staff account

Create a confirmed email/password user in Supabase Authentication > Users, or use an existing confirmed account you intend to be staff. A Supabase dashboard login is separate from this app's Auth user.

Use a password of at least 8 characters with uppercase, lowercase, a digit, and a printable ASCII symbol. Configure the same minimum/character requirements in Supabase Auth's Email/password settings for server enforcement.

In SQL Editor, replace the email below with your actual confirmed staff email and run:

```sql
insert into public.portal_staff(user_id)
select id from auth.users
where lower(email) = lower('YOUR-STAFF-EMAIL@YOUR-COMPANY.COM')
  and email_confirmed_at is not null
  and is_anonymous = false
on conflict (user_id) do nothing;

select u.id, u.email
from public.portal_staff s join auth.users u on u.id = s.user_id;
```

If no staff row appears, confirm the Auth user exists, has the correct email, and is confirmed. Never promote an anonymous guest. Do not store staff passwords in SQL files or source code.

Existing assignment owners are not automatically promoted by migration 002. If an existing owner's account should now be staff, authorize that specific account. Other old records remain stored but inaccessible to a nonstaff owner. Ownership transfers require a separate reviewed data/storage migration; do not bulk-promote all old users.

## 3. Enable background guest sessions

In Supabase Auth settings:

- Turn **Allow new users to sign up ON**.
- Turn **Allow anonymous sign-ins ON**.
- Keep email/password Auth enabled for staff.
- The app has no public signup form. Explicit portal_staff membership, not signup or user metadata, grants staff permissions.

This **supersedes the earlier instruction to disable all signups**. Supabase's anonymous signup endpoint also checks the global signup switch. With it disabled, guest opening returns signup_disabled. An anonymous session has an Auth record/internal user ID but requires no photographer email, password, or registration steps. An ordinary newly created Auth account has no staff privileges and cannot access private data without an assigned valid link.

Guest and staff browser clients use different session-storage keys. Opening a photographer link in a staff browser does not replace the staff login. A guest session is created only after the visitor chooses Open property visit; existing valid guest sessions can resume access automatically. Reading the public guide does not create guest users.

## 4. Configure the application

Keep these values in the repository-root .env.local:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

Use only the browser-safe publishable key (a legacy anon key also works). Never use a secret/service-role key or database password in NEXT_PUBLIC settings. This implementation requires no app service-role key or privileged server API. .env.local is ignored by Git; .env.example is empty documentation.

Restart development, or rebuild production, after environment changes:

```powershell
npm run dev
# OR
npm run build
npm run start -- --hostname 127.0.0.1 --port 3100
```

## 5. Configure CAPTCHA before public use

Local development may omit the Turnstile site key while Supabase CAPTCHA is disabled. Before sharing the portal publicly:

1. Create a Cloudflare Turnstile widget for your actual approved hostname (and development hostnames as needed).
2. Put its public site key in NEXT_PUBLIC_TURNSTILE_SITE_KEY.
3. Enable Turnstile CAPTCHA in Supabase Auth and put the widget's **secret key only in the Supabase dashboard CAPTCHA configuration**. Do not place it in NEXT_PUBLIC settings or send it in chat.
4. Restart/rebuild and test both guest creation and staff sign-in/password recovery.

The shared verification component supports compact/flexible layouts, token expiration, and a fresh challenge after failed attempts. Tokens are sent to Supabase Auth as captchaToken; Supabase performs verification. Staff sign-in and password reset requests include verification too, because enabling project-wide CAPTCHA can affect those endpoints. Do not enable the server switch without adding the matching public site key to the app. Server-side Auth rate limits remain in effect.

## 6. Configure staff password-recovery redirects

Set the development Auth Site URL to http://localhost:3000 and allow:

- http://localhost:3000/photographers/staff
- http://127.0.0.1:3100/photographers/staff

Add the eventual HTTPS production origin and staff callback when hosting is selected. Recovery requests now redirect to /photographers/staff, not /photographers/upload. Request a fresh recovery email after this change. Configure approved email delivery for real staff recovery; no email was sent during development verification.

Staff auth keeps the eye toggle, live new-password requirements, and green success/red error modals. Existing password sign-in is checked by Supabase rather than the client's new-password complexity rules. Photographers do not use this login page.

## 7. Staff workflow

1. Open /photographers/staff and sign in with the authorized staff Auth account.
2. Create a visit with the full address. Each visit has its own UUID, even at a repeated address.
3. Open the visit and use Photographer access > Create private link. Choose 1, 7, 14, or 30 days; default is 7.
4. Copy the generated link immediately and share it privately with the assigned photographer. The app does not send messages for you.
5. Track the visit in the existing searchable library and view its files, responses, notes, and receipt.
6. Replace a link to invalidate all older links and their redeemed grants for that visit. Revoke guest access removes access without issuing a replacement.

Only a SHA-256 hash is stored in the database. The raw token is generated using 32 cryptographically random bytes in the staff browser and appears in the URL fragment (#token=...), which is not sent in normal HTTP page requests/referrers. The database hashes the supplied token. Staff can read link metadata but cannot retrieve hashes/raw tokens through the app. If you leave without copying a newly generated link, replace it.

Anyone holding a still-valid link may open that property visit. There is no email verification binding it to a named person. Use private sharing, short expiry, and revocation. New upload links cannot be issued for submitted visits; an existing valid link can still open its read-only receipt.

## 8. Photographer workflow

1. Open the complete private link sent by staff. The public Property Visits page also accepts a pasted full link for this same website.
2. Choose Open property visit, completing CAPTCHA if configured. No email/password is requested.
3. The background session redeems the token for that visit. After successful redemption, the fragment is removed from the address bar. The database grant and local session allow refresh/resume until the link expires or is revoked.
4. Confirm the address. Upload photos/video into Exterior, Interior, Mechanical, Condition, and Walkthrough categories.
5. Complete the property checklist and notes. Save draft explicitly before leaving. File uploads save immediately; unsaved checklist edits do not.
6. Submit when ready. The database validates the checklist and uploaded category coverage atomically and returns the timestamped read-only receipt.

Use the original complete link when switching browsers/devices or after clearing local browser storage. A bare UUID URL grants nothing by itself. Invalid, expired, revoked, disabled-guest, and incomplete-project states are handled with explanatory messages.

The public /photographers/checklist remains a practice checklist. It is not automatically copied into a saved property visit.

## 9. File and submission rules

- Private bucket: property-media. Paths remain staff-owner-UUID/visit-UUID/category/random-UUID-sanitized-filename.
- Formats: JPG, PNG, WebP photos; MP4, MOV, WebM video.
- Nonempty files up to 50 MiB (52,428,800 bytes) each, displayed as 50 MB; up to 25 files per selection.
- Transfers are standard uploads, not resumable. Compress/split larger videos. Interrupted batches retain completed files; check the category list before retrying remaining files.
- All 19 checklist items must be reviewed. Non-final groups allow Unavailable / N/A, with notes explaining each exception (at least ten characters if any exception is used). Final confirmations must be Complete.
- At least one photo is required. Exterior/interior/mechanical/walkthrough each need files unless their entire checklist group is unavailable with notes. Condition photos depend on actual findings; no blanket condition-image quota is imposed.
- Validation checks self-review and stored file existence, not actual room coverage, image quality, building-code compliance, or diagnostic accuracy.
- Submitted visits/files are read-only. Staff can revoke guest access to the receipt but cannot edit submitted data through the app. Review approval, reopening, scheduling, and correction history are not implemented.
- Revision checks reject stale checklist saves. Visit row locks serialize file metadata writes/deletes with submission and link replacement/revocation.
- Expiry/revocation is enforced for each new database/Storage request, including already redeemed sessions. Cached browser content cannot be erased remotely. Already-issued private signed viewing URLs can remain usable for up to their 60-second expiration; no new URLs can be issued after access is revoked.

Do not make the bucket public or weaken RLS to fix an upload error. Do not delete storage.objects rows directly; use the Storage dashboard/API for actual files. Anonymous Auth records count toward project usage; cleanup/retention and backups are project-owner operations and are not automated by this app.

## 10. Validation and launch checks

```powershell
npm test
npm run lint
npm run build
```

Tests run the original schema and the new migration in embedded PostgreSQL/PGlite with minimal Auth/Storage schema stubs. They verify staff-only creation, no self-promotion, hashed-token protection, invalid/wrong-property links, guest file isolation, saved drafts, stale revisions, expired/revoked/replaced grants, category coverage, immutable submissions, and bare public-request denial. Additional tests cover token generation, same-origin URL parsing, upload/password rules, and auth feedback.

Before public deployment, use a development Supabase project and separate browser profiles:

- Verify staff can sign in/create a visit and an ordinary email user cannot access staff functions.
- Open a copied link in a fresh browser; confirm no email/password is required, then upload real files, save/reload a draft, and submit.
- Try a second property UUID without its token and inspect its Storage path; access must fail.
- Redeem the link in two browser profiles, then replace/revoke it from staff; both old guest grants must stop working. Also test expiration after redemption.
- Confirm submitted records reject further saves/uploads/removals while valid receipt reads continue.
- Confirm a guest link does not log a staff account out in the same browser.
- Test CAPTCHA success/expiry/failure, resize behavior, staff password recovery, auth modals, copy/manual-copy, keyboard navigation, mobile layouts, and reduced motion.
- Approve fictional team profiles, example media, placeholder contacts, review/help destinations, and the actual hosting origin separately.

Local tests and production compilation do not exercise hosted Auth, email delivery, actual Storage bytes, real JWTs, CAPTCHA service verification, or simultaneous browser/network requests. No remote migration/configuration, staff promotion, anonymous-account creation, real upload, email, deployment, or reference-site modification was performed by the agent during this change.

Local execution record, November 5, 2026: all 28 automated tests passed, along with lint, production build/TypeScript, diff whitespace checks, and HTTP checks for 11 public/staff/guest-route URLs. The photographer landing contains no password form; dynamic guest shells render with noindex/no-referrer metadata. Production preview is available on port 3100. This records local verification only, not hosted migration or end-to-end approval.

## Official references

- [Anonymous sessions](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Auth settings](https://supabase.com/docs/guides/auth/general-configuration)
- [Anonymous signup checks](https://github.com/supabase/auth/blob/master/internal/api/anonymous.go)
- [Storage authorization](https://supabase.com/docs/guides/storage/security/access-control)
- [Auth CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha)
- [Turnstile widget rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
- [Password security](https://supabase.com/docs/guides/auth/password-security)
