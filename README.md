# Home Offer 365 Photographer Portal

Standalone Next.js guide with private property submissions backed by Supabase. Photographers use an expiring property link without registration or passwords. Staff sign in separately to create visits, issue/revoke links, and review their submissions. Not deployed; no GHL integration. homeoffer365.com is a reference website and is not modified or used as this project's hosting target.

## Run locally

Use Node.js 22.20+ and npm.

```powershell
npm install
npm run dev
```

Open http://localhost:3000/photographers. Guide pages and the photographer landing page work without Supabase configuration; actual private records/uploads require setup.

```powershell
npm test
npm run lint
npm run build
npm run start -- --hostname 127.0.0.1 --port 3100
```

## Supabase setup — November 5, 2026

Follow [the database setup/runbook](docs/2026-11-05-database-plan.md) for exact SQL, Auth switches, staff authorization, CAPTCHA, recovery redirects, and hosted validation.

1. Apply migration 001 on a new database, then migration 002. **If 001 is already applied, run only 002.** Managed database name is postgres.
2. Create a confirmed staff Auth account and add that specific user to portal_staff using the runbook SQL. No account is promoted automatically.
3. Enable both Allow new users to sign up and Allow anonymous sign-ins. This supersedes earlier signup-disabled instructions. Background guest sessions need signup enabled; a new account still has no staff privileges.
4. Keep the project URL/publishable key in .env.local. Never put a service-role/secret key or database password in NEXT_PUBLIC settings. No app service-role key is required.
5. For public use, configure Turnstile in Supabase Auth and NEXT_PUBLIC_TURNSTILE_SITE_KEY in the app. Guest opening, staff sign-in, and staff recovery support CAPTCHA. Local development can omit CAPTCHA only while the Supabase CAPTCHA switch is off.
6. Configure staff recovery redirects to /photographers/staff on your local/production origin; restart or rebuild after changing public environment values.

The agent has not applied SQL or settings to your hosted project, promoted staff, or tested real accounts/uploads. Existing .env.local values were not read or edited.

## Pages

| Route | Purpose |
| --- | --- |
| / and /photographers | Welcome, guide steps, team/company resources |
| /photographers/photo-guide | Four photo categories, galleries, shot lists, illustrative video |
| /photographers/checklist | Temporary practice checklist; reset and print |
| /photographers/upload | Public private-link entry and instructions; no photographer login |
| /photographers/visit/[id]#token=... | Scoped guest property checklist, notes, uploads, submission receipt |
| /photographers/staff | Staff-only sign-in, visit library, link management, review |
| /photographers/help | Visit FAQs and assigned-team guidance |
| /photographers/team | Fictional team template |
| /photographers/homeowner-stories | Editorial homeowner-experience themes |

## How it works

Staff create a property visit, select its link expiry (1/7/14/30 days), and copy the new private link. Share it privately with the assigned photographer. The app does not send messages. A replacement revokes earlier links/grants; Revoke stops guest access without issuing a new link. Tokens are 256-bit random values; only their SHA-256 hashes are stored. Raw links can be copied immediately after creation but cannot be retrieved later. Submitted visits cannot receive new upload links.

Photographers open the complete link and choose Open property visit, completing CAPTCHA if enabled. Supabase uses a background anonymous Auth session and a database grant tied to that link. No photographer email/password/account-registration step is required. Guest and staff sessions use separate browser storage keys. After redemption, the token fragment is removed from the address bar; refresh works through the saved session/grant. A new device or cleared storage needs the original full link. A bare visit UUID conveys no access.

The same editor serves guest and staff sessions. Category buttons show/filter real file counts. Checklist groups show reviewed totals; notes have a character counter. Files save immediately, while checklist/notes need Save draft or Submit. The public practice checklist is separate and clears on reload. Save before navigating away. Reload/close prompts for dirty edits or active transfers; switching staff visits is blocked while editing/working.

Submission validates the 19 checklist responses, revision, N/A explanations, and uploaded category coverage in the database. At least one photo is required; exterior/interior/mechanical/walkthrough each need files or a documented whole-group exception. Condition photos follow actual findings. Submitted data is read-only, with a timestamped receipt. Review approval/reopening, scheduling, automatic notification, retention, and ownership transfer are not implemented.

Files remain private under staff-owner/visit/category paths. Supported: JPG/PNG/WebP and MP4/MOV/WebM, nonempty files up to 50 MiB each, 25 files per batch. Standard uploads retain completed files on a partial batch failure; resumable uploads are not implemented. Larger video needs compression/splitting. Private viewing links last 60 seconds. Expiry/revocation blocks new API/Storage requests and existing grants, but cached content and previously issued viewing URLs cannot be erased immediately.

RLS, staff membership, and scoped grants are the access boundaries. The public page shell conveys no permission. No private records are fetched in server rendering or cached HTML. Dynamic guest pages stream only their public shell/route parameters; pathname-based navigation/animation uses Suspense boundaries.

## Structure

```text
app/                            Public, staff, and dynamic guest routes; shared styles
components/layout/              Responsive shell, logo, navigation, footer
components/photographer-guide/   Public content, practice checklist, photo/video dialogs
components/portal/
  guest-landing.tsx             Public private-link entry
  guest-visit.tsx               Background guest session and scoped visit
  portal-workspace.tsx          Staff auth, authorization gate, visit library
  staff-link-manager.tsx        Create/copy/replace/revoke links
  visit-browser.tsx             Search, filters, status/progress cards
  visit-editor.tsx              Shared checklist, notes, save/submit/receipt
  visit-files.tsx               Private categorized file transfer/view/remove
  captcha-verification.tsx      Responsive Turnstile widget for guest/staff Auth
  password-field.tsx            Eye toggle and live new-password requirements
  auth-feedback-modal.tsx       Green/red accessible Auth outcome dialog
lib/supabase/client.ts           Separate staff/guest browser clients
lib/portal/                     Visit types, link helpers, password and Auth feedback
supabase/migrations/            Initial schema (001) and private links/staff roles (002)
tests/                          Embedded PostgreSQL/RLS and focused validation tests
content/                        Guide resources, illustrations, company templates
public/                         Logo, supplied examples, video/poster
docs/                           Dated runbook, page plan, change log
.env.example                    Empty public configuration template
```

## Presentation and content

The navy/cyan shared logo, phone hamburger drawer, footer quick links/contact content, short interaction animations, and reduced-motion support remain. Need Help cards share desktop dimensions and readable type, stacking on small screens. Photo dialogs keep title/close/gallery controls visible while their content scrolls.

Team names (Daniel Bennett plus 17 others), initial avatars, homeowner themes, footer contacts, and unprovided review/help links remain template content for approval before launch. Contact information is a preview placeholder; the Sample only badge and visible AI-generated illustration labels were removed at the user's request. The seven user-provided images are Gemini illustrations, retained as such in alt text/documentation. They demonstrate coverage, not real inspections, reliable architectural orientation, or verified building installations. The supplied 12.23-second interior video is illustrative, not a full inspection; review its audio/accessibility before publishing. Original Downloads files remain unchanged.

## Verification and remaining hosted work

npm test runs migrations in embedded PostgreSQL/PGlite with minimal Supabase Auth/Storage stubs, testing ownership, staff roles, guest scope, invalid/expired/revoked/replaced links, file isolation, submission validation/locking, revisions, and helpers. This does not test hosted Auth/email/CAPTCHA, actual Storage bytes/JWTs, browser interactions, or simultaneous network requests. Follow the runbook's staff/two-guest-browser checklist before launch.

Record subsequent changes in [CHANGELOG](docs/CHANGELOG.md), [page plan](docs/2026-11-05-photographer-guide-plan.md), and [database runbook](docs/2026-11-05-database-plan.md). No deployment or reference-site action is part of this implementation.
