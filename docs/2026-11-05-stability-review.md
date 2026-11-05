# Stability review — November 5, 2026

## Assessment

The current local implementation passes the checks below. This is evidence of local correctness, not a guarantee of zero errors or confirmation that the hosted Supabase integration is ready for production.

## Issue found and fixed

The guest visit listened to every URL fragment change and reloaded the page. Clicking Photos & video, Checklist, or Visit notes therefore could reload the editor and lose unsaved work.

The listener now reloads only when a valid private-link token enters the URL fragment. Ordinary section anchors do not reload the page. A regression test exercises all three section anchors, empty/invalid fragments, and a valid new private link.

## Completed checks after the fix

| Check | Result |
| --- | --- |
| Automated tests | 29 passed; 0 failed or skipped |
| Database tests | Both migrations exercised locally, including role/scope restrictions, expiry/replacement, private media permissions, stale revisions, submission validation, and read-only receipts |
| ESLint | Passed |
| Production build / TypeScript | Passed |
| Local production HTTP checks | 11 page routes returned 200, including staff and valid/invalid guest route shells |
| Unknown route | Returned 404 |
| Generated JavaScript/CSS assets | 16 discovered assets returned 200 |
| Public assets | All 10 files returned 200 for HEAD requests |
| Video range requests | Returned 206 with the requested 1,024 bytes |
| Staff return navigation | Back to Property Visits present in rendered HTML |
| Guest route metadata | noindex and no-referrer present |
| Diff whitespace check | Passed before documentation updates |

HTTP checks used a local production server on port 3102. They verify server responses and asset availability, not browser execution or live property access.

## Remaining verification

- Apply the documented migrations/settings to the intended Supabase project and confirm staff membership.
- Exercise real staff login, recovery email, guest session creation, CAPTCHA, file upload/removal/viewing, draft saves, and final submission.
- Test two browser sessions for expired/revoked links, concurrent edits, and interruptions during transfers.
- Check desktop/mobile rendering, keyboard navigation, dialogs, and unsaved-work behavior in a real browser. The existing unload warning does not guarantee protection for every in-app route change; save drafts before navigating away.
- Review approved company content and destinations before launch.

The review did not inspect or edit .env.local, change hosted Supabase data/settings, contact the reference website, or deploy the application.

## Non-blocking tool output

Node's test runner emitted module-type detection warnings for imported TypeScript modules. Next.js ignored an unrelated parent-directory lockfile. Neither warning failed the tests or build.
