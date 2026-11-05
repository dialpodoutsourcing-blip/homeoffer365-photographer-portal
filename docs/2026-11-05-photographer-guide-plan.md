# Home Offer 365 Photographer Guide — Discussion Draft

## Stability follow-up - November 5, 2026

Guest visit section anchors now scroll within the editor without triggering private-link reloads. Only valid token fragments reopen link validation. See [the stability review](2026-11-05-stability-review.md) for the regression test, 29 passing tests, production checks, and remaining hosted/browser validation.


## Staff Access return navigation - November 5, 2026

The staff page includes a persistent Back to Property Visits link above its heading. It returns to the public property-link entry page at /photographers/upload and remains available across authentication and workspace states.


Date: November 5, 2026 (America/New_York)\
Version: 3.0 private property links and staff access\
Status: Public guide, staff workspace, and account-free photographer-link code implemented locally; not deployed. Migration 002, explicit staff membership, anonymous Auth/signup switches, CAPTCHA, and hosted validation need applying/checking in the project. Official Google Reviews, approved staff details, and help contacts also remain pending.

## Current approach: private photographer links — November 5, 2026

The user approved the recommended public-guide/private-property-link workflow. Public Property Visits no longer shows photographer login. Staff sign in at `/photographers/staff`, create their own property visits, and issue/copy/replace/revoke expiring links. Photographers open `/photographers/visit/[id]#token=...` without email, password, or registration; a separate background anonymous Supabase session redeems the token for property-scoped database and Storage access. Only hashed tokens are stored. Expiry and revocation apply to already redeemed grants, and submitted visits/files remain read-only.

Migration `202611050002_private_visit_links.sql` follows the existing initial schema, preserves stored visits/files, adds explicit staff membership/link/grant tables, and updates RLS/authorization/save functions. No old account is automatically promoted. The public guide remains independent of Supabase. Shared editor/file components take the appropriate staff or guest client, avoiding duplicated submission rules or mixed sessions. New guest landing/access, link-management, and optional responsive Turnstile components are organized under `components/portal/`; token helpers are under `lib/portal/`. Private records are loaded only after browser authorization, never into static server HTML. Suspense boundaries around pathname navigation/page transitions support the new dynamic route.

The earlier signup-disabled/account-required instructions below are historical and superseded by [the current runbook](2026-11-05-database-plan.md). Background anonymous sessions require both new-user signup and anonymous sign-in enabled; staff authority comes from the protected portal_staff table. CAPTCHA is supported for guest creation, staff sign-in, and staff recovery. No service-role app secret is needed. Agent work did not execute remote SQL, edit .env.local, promote real users, or create live anonymous sessions/uploads. Hosted settings and complete browser verification remain required.

## Historical account-based workspace — November 5, 2026

Auth feedback enhancement: green success/red error native modal dialogs now cover explicit sign-in, recovery request, password update, and sign-out results. Native required/email/minimum-length errors are shown as red modal feedback, and Supabase invalid-credential errors share one email-or-password message. Successful sign-in is acknowledged only after a returned session. Dialogs lock background scrolling, contain focus, and close using buttons, Escape, or backdrop. Message mapping lives in `lib/portal/auth-feedback.ts` with focused tests. Hosted/browser verification remains pending; no schema or remote configuration changes were made.

Password controls enhancement: sign-in and recovery now use a shared accessible eye-toggle field. Recovery includes live requirements for at least 8 characters, uppercase, lowercase, digit, and printable ASCII symbol, and validates these before updateUser. Sign-in permits existing passwords without imposing new complexity validation. Password policy logic and tests are separate from the field component. Matching Supabase Auth settings are documented in the runbook; no remote setting or SQL migration was changed.

Property Visits presentation enhancement: added a branded sign-in introduction, signed-in account bar, real record summary counts, address search/status filters, selectable visit cards and show-more behavior. The library reads owner records in pages and refreshes the active editor safely. The editor now offers section links, media category counts/filtering, collapsible checklist groups, note length feedback, and a desktop sticky save/submit bar. Selection moves focus to the editor; scrolling honors reduced motion. Phone layouts stack controls. New presentation components are `workspace-intro.tsx` and `visit-browser.tsx`; auth and database contracts stay unchanged, and no SQL needs rerunning for this update.

The latest approved scope expands the original guide with a working Supabase-backed photographer workspace at `/photographers/upload`. It replaces the external form handoff with email/password sign-in, property visit records, explicit draft checklist/notes saving, private categorized uploads, private viewing links, and validated submission receipts. Supabase project creation has not happened; code/setup preparation was authorized, not live provisioning or deployment.

New implementation is organized under `components/portal/`, `lib/supabase/`, `lib/portal/`, `supabase/migrations/`, and `tests/`. Public photography examples, welcome pages, team template, mobile navigation, branding, and the temporary practice checklist remain available. The practice checklist clearly links to the separate saved property checklist. Sidebar, footer, overview, help, and upload copy now point to the property workspace.

Database authorization checks ownership, expected revision, checklist v1 completeness, documented N/A exceptions, and uploaded category coverage. Submitted visits and files are read-only to photographers. Files are private with 60-second signed viewing links. Client and storage policies restrict file categories/types/sizes. Draft uploads/removals lock the visit row to serialize with submission.

See [database setup and runbook](2026-11-05-database-plan.md) for actual database name `postgres`, suggested project names, exact migration file, environment settings, account creation, test commands, team dashboard review, and pending hosted verification. The earlier dated sections below describe the history; their external-form-only/database-free statements are superseded for saved property visits.

## Portal screenshot logo direction — November 5, 2026

The user re-supplied the original portal screenshot as the latest system-logo reference. The circular emblem is superseded by a cyan house outline with a doorway, paired with stacked bold HOME / OFFER 365 text. SVG remains transparent; text is white on navy and dark in the footer. The shared component updates all placements and the favicon asset together. No external reference website was accessed or modified. Supabase setup/code preparation remains authorized but pending; no live project or database migration has been created.

## Clean reference logo — November 5, 2026

The latest supplied logo image supersedes the earlier camera/lens design. The shared logo now uses a clean blue circular house emblem and a two-line HOME / Offer 365 wordmark. Removed the badge, camera detail, small descriptor, and baked-in background; retained legible light/dark treatments for sidebar, phone header, and footer. The favicon uses the same emblem. Supabase integrated-submission preparation is authorized but pending after the user interrupted that work to request this logo update. No live Supabase project exists yet, and no migration or configuration has been applied.

## Fictional team names — November 5, 2026

The user requested generated replacement names for the team template. All 18 reference names have been replaced by fictional full names with matching initials. The featured founder is now Daniel Bennett; his greeting and signature use Daniel. The signature is centralized alongside the founder content. Roles, department grouping, and page layout remain as the template structure. These profiles are not a verified company directory and require replacement with approved personnel before publication. The page continues to omit Sample wording at the user's request. Earlier entries referring to the original reference names are historical.

## Team reference layout update — November 5, 2026

The user supplied a pasted team-page reference and requested a similar template. Replaced the initial role-only page with a featured founder introduction, seven department sections, 17 additional profile cards, short bios, personal notes, and department jump links. Names and roles are taken from the user-provided text, with initial-based avatars because no headshots were supplied. Founder copy and personal-note excerpts use the reference; bios are condensed. The main content does not use Sample wording, as previously requested. The roster is editable template content and has not been independently verified for production. Company totals, Google rating, tenure badges, and hiring claims were omitted. The external reference site was not accessed or modified. No database or deployment changes. Historical role-only notes below are superseded by this update.

## Team and homeowner templates — November 5, 2026

Replaced the two Welcome cards' unavailable actions with local Team and Homeowner Stories routes. At the user's request, their displayed content omits Sample and Coming soon wording. Team introduces visit coordination, property review, and submission-support roles without invented personnel. Homeowner Stories describes clear communication, respectful visits, and useful documentation as the intended experience, without fabricated customer quotes, names, ratings, or Google endorsements. Editorial content lives in content/company-resources.ts. The official Google Reviews destination remains separately configurable and is not replaced by a fake review source. Internal resource links stay in the same tab, and Welcome remains selected in sidebar navigation on these related pages. No external reference site, database, or deployment changes were made.

## Interaction animation update — November 5, 2026

Added short hover/press feedback to interactive controls and cards, moving footer-link arrows, and brief page/dialog/drawer entry animations. The page template keys its wrapper by pathname so deeper route changes also receive entry feedback; the checklist provider remains outside that wrapper. Motion is limited to 160–220ms with no added navigation delay or animation dependency. Hover movement is restricted to fine-pointer devices, and reduced-motion/print rules disable motion. Core content, navigation destinations, database scope, and reference-site boundaries are unchanged. See CHANGELOG.md for validation limits.

## Logo design refresh — November 5, 2026

At the user's request, the local guide now uses a custom house-and-camera-lens SVG mark with a cyan roof, white framing, and an orange accent. A shared BrandLogo component combines it with layered HOME/OFFER lettering, a blue 365 badge, and a photographer-guide descriptor. Light/dark variants and compact sizes align the sidebar, phone header, footer, and favicon. The logo is a local design draft; corporate approval is not implied. No external website or deployment was changed. See CHANGELOG.md for validation.

## Phone navigation enhancement — November 5, 2026

At widths up to 760px, the desktop sidebar/horizontal links are replaced by a compact brand bar and hamburger button. MobileNavigation opens a native modal drawer using the shared SidebarNavigation, so destinations and selected-page state match desktop. Selection closes the drawer, including selecting the current page. Close, native Escape, and backdrop dismissal are supported, with native focus containment/return. Background scrolling is locked while open, and crossing back to the desktop breakpoint closes the drawer. Navigation UI is excluded from printing. No original content, external links, database scope, or deployment settings changed. See CHANGELOG.md for validation limits.

## Shared footer enhancement — November 5, 2026

Follow-up requested by the user: footer navigation is now labeled Quick links with arrows. The contact card contains sample-only, non-clickable email and phone details (photographers@example.com; +1 (202) 555-0148), with a visible preview label. These are placeholders to replace before launch, not company contact information. The local Help link remains available.

Replaced the minimal footer with a reusable SiteFooter containing a brand/People Over Profit message, labeled navigation to all five guide pages, and an assigned-team help card linking to the local Help page. The bottom row retains copyright, a thank-you message, and Back to top targeting the shared main content. Responsive styles use three columns on desktop, two on medium screens, and one on narrow phones. The footer stays hidden when printing. No external contacts or policy pages were invented, and no reference-site access or deployment was performed. Validation is recorded in CHANGELOG.md.

## Multi-page navigation enhancement — November 5, 2026

The user requested stronger sidebar navigation because every item previously scrolled within the same page. The guide now uses distinct routes while preserving all original content and the standalone scope:

| Route | Content |
| --- | --- |
| `/` and `/photographers` | Welcome, People Over Profit message, visit-step links, team/company/review resources |
| `/photographers/photo-guide` | All four photo categories, exterior gallery, shot lists, video sample, safe-access guidance |
| `/photographers/checklist` | All 19 checklist items, five expandable groups, progress, reset, print checklist |
| `/photographers/upload` | Address/category preparation, missing-area reporting, external upload handoff |
| `/photographers/help` | Assigned-team contact guidance and visit questions derived from the supplied guide |

The root layout owns one shared shell and in-memory ChecklistProvider. Next.js Link handles navigation; usePathname and aria-current page select the sidebar item. Welcome actions, next-step buttons, brand, and help links use the new routes. Checklist checks survive internal page navigation but reset on reload; no submission or database persistence is implied. Printing on the checklist page prints that checklist, not other pages. Earlier single-page notes below are historical and superseded by this enhancement.

No database, authentication, or native upload handling was added. The screenshots and original long text remain references for branding and required content; homeoffer365.com was not accessed or modified, and no deployment or hosting changes were made. See CHANGELOG.md for validation and remaining browser-review limits.

## Supplied media integration — November 5, 2026

### Additional exterior views

- Added three newly supplied AI-generated images as exterior-rear.jpg, exterior-side-garden.jpg, and exterior-side-brick.jpg. Combined them with the existing front/driveway illustration in a four-image exterior gallery.
- Exterior View examples opens a gallery with thumbnails, previous/next controls, image count, and distinct image descriptions/captions. Other categories retain their single-image examples. Reopening starts at the front image.
- Side angles are named by visible features rather than claimed as verified left/right elevations. The generated house details vary; actual assignments must still separately document front, rear, both sides, roof/gutters, yard, driveway, outbuildings, and visible damage.
- These changes are confined to the local standalone project. Per the user's clarification, homeoffer365.com remains a reference, not a deployment destination; no changes or further access to that website were made for this update.
- No database changes or commands. See CHANGELOG.md for validation.

### Initial sample media

- User supplied four unique Gemini-generated illustrations and a short MP4 after clarifying that example media, rather than real company submissions, is sufficient.
- Mapped xldbe5xldbe5xldb to condition.jpg, 5av8l25av8l25av8 to mechanical.jpg, lxxinxlxxinxlxxi to interior.jpg, and dg2ae1dg2ae1dg2a to exterior.jpg in public/images/photo-examples. Original Downloads files are untouched.
- The exterior “Copy” file has the same SHA-256 hash as the original and is intentionally excluded.
- Replaced remote stock photography and mechanical/condition icon placeholders with the supplied illustrations. The hero reuses exterior.jpg. Full-image dialogs include AI-generated labels, explanatory notes, native close/Escape behavior, and full uncropped views.
- Embedded public/videos/interior-sample.mp4 with native controls, inline playback, no autoplay, muted initially, and preload none. A poster frame was extracted at roughly 10% of the video.
- Video metadata: 3840x2160, 30 fps, 367 frames, about 12.23 seconds, 34,288,240 bytes. Sampled frames show furnished dining/living areas and later window glare. This is labeled an illustrative interior clip, not a full-property inspection. A visible visual description explains the scene and remaining assignment requirements.
- The MP4 contains an audio track; audio was not reviewed and no transcript was provided. Review audio and provide captions if meaningful sound or speech is retained before launch.
- Photo-example and video Coming soon states are now replaced with usable local media. Other unavailable external destinations remain honestly labeled.
- No database or upload service was added. Validation results are recorded in CHANGELOG.md. Earlier review notes below describe the state before these files were supplied.

## Confirmed direction

- Build a standalone, mobile-friendly guide page, independent of GHL.
- Version one is an informational guide with a link to an external upload form, as confirmed by the user on November 5, 2026.
- Follow the supplied Home Offer 365 branding reference.
- Initial discussion is complete and implementation is authorized; deployment remains a separate later step.
- Keep dated records of scope, changes, database needs, and database commands.

## How the references apply

### Reference review — November 5, 2026

The user re-supplied both images and requested comparison with the original long guide. Treat the long guide as the content source and the images as design/interaction references, rather than a requirement to copy every feature. The site remains standalone; the GHL suggestion in image 2 does not apply.

Source review confirmed that all seven content sections, four photo coverage categories, and 19 checklist items are represented. Welcome copy is adapted rather than verbatim. Example galleries, walkthrough video, team/reviews links, and the external upload destination remain unavailable until approved resources are provided. Image 2 additionally suggests good/unacceptable example comparisons, mandatory checklist completion, and automatic property-address organization. These behaviors are not implemented: comparisons need approved assets, and enforced completion/automatic organization would need support in the selected external form or a separately scoped portal. The screenshot's saved onboarding progress and user profile are also outside the current guide scope. This review did not change application code or verify rendered appearance.

The pasted welcome and inspection guide supplies the content. Image 1 supplies the visual direction: navy navigation, bright blue actions, white cards, pale blue backgrounds, and orange highlights. Exact brand color values and the official logo still need confirmation; colors sampled or estimated from a screenshot would be provisional.

Image 2 supplies a useful compact arrangement with team, reviews, photo samples, video samples, checklist, and submission links. Its recommendation to build inside GHL does not apply because the user explicitly requested a standalone site. Its proposal to require checklist completion before submission is not a confirmed requirement for this guide-only version.

The screenshot's account avatar, saved onboarding progress, file picker, and assignment checklist imply application features. For version one, use a checklist as a self-review aid and an external upload button. Do not show a fictional signed-in user, saved completion percentage, or upload-success state.

At initial review, the repository contained a Next.js starter page and no database or upload integration. The starter page has now been replaced by the guide. Existing package.json and package-lock.json modifications predate this work.

## November 5 implementation update

- Implemented `/` and `/photographers` with reusable section components and centralized content in `content/photographer-guide.ts`.
- Added responsive navy navigation, welcome area, four photo-category cards, full expandable shot lists, walkthrough guidance, company resources, upload information, and help.
- Implemented 19 self-review checklist items across five groups, computed progress, reset, and print. Checks reset on reload. Print expands all shot lists and checklist groups and restores their prior state afterward.
- Missing resource URLs render non-clickable “Coming soon” labels. The upload action becomes an external link when its approved destination is configured. This app does not handle uploads.
- Used two remotely hosted Unsplash images as labeled illustrations; mechanical and condition cards use icon illustrations. These are not approved inspection samples. Replace these images with approved local assets before launch.
- Added a provisional house mark and screenshot-derived colors; official branding remains pending.
- Replaced starter metadata and remote Google font loading with guide metadata and system fonts.
- No database is required for the selected guide-only flow. Native assignment or upload management would require a separate scope change.
- README.md records the actual structure and commands. CHANGELOG.md records validation and remaining limits.

The supplied live URL could not be retrieved through the browser tool. Its current layout and behavior remain unverified. The supplied screenshots are design references, not proof of an existing deployed portal.

## Proposed page structure

One page with section anchors is sufficient. Desktop can use the screenshot's navy sidebar; mobile should have a compact header and accessible section navigation. All primary content remains available without navigating through an application dashboard.

| Section | Proposed content and behavior |
| --- | --- |
| Welcome | Home Offer 365 logo; “Welcome to the Home Offer 365 Team!”; People Over Profit message and brief purpose. |
| Meet Our Team | Short introduction and link to the approved team page. |
| About Home Offer 365 | Company introduction, official website link, and official Google Reviews link. |
| Photography & Video Guide | Four cards for Exterior, Interior, Mechanical Systems, and Property Condition, each with a View Examples action. Approved examples may expand inline or link to an approved gallery. |
| Walkthrough Video | Approved sample video and instructions for a clear, steady recording covering layout, condition, and visible issues. |
| Photographer Checklist | Full grouped checklist below; proposed printable checklist with optional session-only checkboxes. Persistence is not included. |
| Upload Photos & Videos | Prominent button opening the approved external upload form; instructions to organize files by property address and category. |
| Need Help? | Approved contact method for the assigned team member and a closing thank-you. |

Suggested navigation labels: Welcome, Photo Guide, Checklist, Upload Files, Help. Team and company information can sit beneath the welcome section so the guide stays easy to scan.

## Photo coverage to preserve

- **Exterior:** front, rear, both sides, roof and gutters, driveway, yard, outbuildings, visible exterior damage.
- **Interior:** living room, kitchen and appliances, all bedrooms, all bathrooms, basement and attic where accessible, floors, ceilings, walls, visible damage and needed repairs.
- **Mechanical:** HVAC equipment, furnace and air conditioning, water heater, electrical panel where safely accessible, visible plumbing, equipment labels and condition.
- **Property condition:** water damage, foundation cracks, roof leaks, mold-like staining, fire damage, structural concerns, unfinished renovations.

Keep the work framed as visual documentation. Do not imply that photographers certify structural safety or diagnose conditions. Proposed clarification for review: photograph from accessible, safe locations; report inaccessible areas rather than entering them or opening equipment to obtain a photo.

## Full checklist content

### Exterior

- [ ] Front, rear, and both sides photographed.
- [ ] Roof, yard, driveway, and outbuildings documented.
- [ ] Exterior damage photographed.

### Interior

- [ ] Every accessible room photographed.
- [ ] Kitchen and bathrooms documented.
- [ ] Basement, attic, and garage photographed where accessible.
- [ ] Interior damage documented.

### Mechanical

- [ ] HVAC system photographed.
- [ ] Water heater photographed.
- [ ] Electrical panel photographed where safely accessible.
- [ ] Visible plumbing and mechanical issues documented.

### Video

- [ ] Full walkthrough recorded.
- [ ] All accessible rooms included.
- [ ] Major condition issues shown.

### Final submission

- [ ] Photos are clear and properly lit.
- [ ] Property address confirmed.
- [ ] All required files uploaded through the external form.
- [ ] Missing or inaccessible areas reported.
- [ ] Assignment marked complete using the team's approved process.

The guide cannot verify external uploads or mark an assignment complete itself. The final item is an instruction for the photographer's existing process. Interactive checks, if selected, must explain that they are not saved to an assignment.

## External upload boundary

The guide directs photographers to the external upload destination. The external service handles file transfer, storage, property details, submission confirmation, and any required validation.

Confirm that the chosen form collects the property address, photographer contact, photo category, video, and inaccessible-area notes. File size limits, supported formats, mobile upload behavior, and folder organization depend on that service. Do not promise automatic sorting or checklist enforcement unless the chosen service actually supports it.

If checklist completion must become mandatory, enforce it in the external form or revise scope to a working portal. A checkbox on a public guide page cannot guarantee completion on an independent upload service.

## Inputs to settle before implementation

| Input | Current status |
| --- | --- |
| Official logo and exact brand colors | Screenshot reference available; original assets needed. |
| Team page URL | Placeholder in supplied text. |
| Company website destination | Company domain supplied; final link target to confirm. |
| Official Google Reviews URL | Not supplied. |
| Approved photos for all four categories | Not supplied; screenshot thumbnails are references. |
| Approved walkthrough video | Not supplied. |
| External upload form URL and provider | Not supplied. |
| Help contact or contact instructions | Assigned team member mentioned; actual method to confirm. |
| Final hosting URL | Undecided. /photographers and portal.homeoffer365.com/photographer appear in references; neither is confirmed as the deployment target. |
| Checklist presentation | Proposed printable list; decide whether session-only interactive checks are useful. |

Do not publish placeholder destinations or use reference-image portraits as actual team members.

## Review criteria for a future build

- All seven supplied content sections and all checklist groups are represented.
- Layout works on phones, tablets, and desktop without horizontal scrolling.
- Links, buttons, and optional checkboxes are keyboard accessible and clearly labeled.
- Brand palette is consistent; text and controls remain readable.
- Photo examples and video use approved assets and have useful descriptions.
- The upload action opens the correct external form and makes the handoff clear.
- The page makes no unsupported claim about saved progress, upload completion, or automatic organization.
- Production links, video playback, and mobile form uploads are checked before deployment.

## Related records

- [Database and runbook proposal](2026-11-05-database-plan.md)
- [Dated change log](CHANGELOG.md)
