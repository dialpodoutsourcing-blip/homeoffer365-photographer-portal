# Demo 5 Camera Photo Workflow Design

## Intent

Demo 5 will retain the complete Demo 4 presentation but replace only its Google Drive submission form with a guided, photo-first field workflow. A photographer enters their details and property address, captures and classifies required photos by category, keeps unfinished work on the device, and submits the photographer record, private image files, and photo metadata to Supabase when the visit is complete. Demo 4 and the site index remain unchanged.

Video capture and the existing walkthrough-video requirement are explicitly deferred to a later phase. They must not block the first photo-only submission flow.

## Goals

- Keep Demo 5 visually identical outside its form.
- Preserve the existing photographer name, email, phone, and Pennsylvania address-autocomplete fields.
- Remove the Google Drive URL field from Demo 5 only.
- Guide photographers through minimum photo counts grouped by category while letting them decide which relevant photo types to capture.
- Open the mobile device's rear camera from each category.
- After capture, require a custom photo name and a specific photo-type dropdown selection.
- Show saved-photo thumbnails, completion state, and controls to view, retake, or remove a draft.
- Allow more than one photo for any type.
- Persist unfinished photos and form state locally with IndexedDB across refreshes or accidental closes.
- Upload private image files to Supabase Storage only during final submission.
- Associate every submitted photo with its photographer and property address.
- Show clear upload progress, retryable failures, and the existing success confirmation only after the complete submission finishes.

## Non-goals

- Video recording or walkthrough uploads.
- Changing Demo 4, the root index, reviews, examples, or other Demo 5 content.
- A photographer login or account-management system.
- An administrative photo browser in this phase.
- Storing binary image data directly in PostgreSQL.

## Photo checklist

Photo types are classification choices, not individually required checklist items. The photographer leads the visit and chooses the relevant type after each capture. `Other` remains available in every category.

- **Exterior:** Front, Rear, Sides, Roof, Yard, Driveway, Outbuildings, Damage, Other.
- **Interior:** Living Room, Kitchen, Hallway / Room Layout, Bedroom, Bathroom, Basement, Attic, Garage, Under Sink, Damage, Other.
- **Mechanical:** HVAC, Water Heater, Electrical Panel, Plumbing, Other.
- **Condition:** General Condition, Damage, Repair Needed, Other.

The submission minimums are four Exterior photos, four Interior photos, one Mechanical photo, and one Condition photo. Additional photos are always allowed. The UI presents one collapsible card per broad category. Each card shows its saved/minimum count, type choices, saved thumbnails, and a prominent `Take Photo` button. The camera input uses `accept="image/*"` and `capture="environment"`. Desktop browsers may show a file picker when direct camera capture is unavailable.

Potentially absent property features have explicit N/A controls, including Basement, Attic, Garage, Outbuilding, and other applicable types. Selecting N/A records the stable feature identifier and an `n/a` status without requiring a placeholder image. N/A selections explain the property's applicable features but do not count toward category photo minimums.

After a capture, an editor appears with:

- image preview;
- required custom photo name;
- required dropdown containing the types for the active category;
- required condition status with `Good Condition` or `Damage`;
- optional description;
- Save and Cancel actions.

Saving writes the compressed image and metadata to IndexedDB and updates the category count. It does not contact Supabase. Removing a photo reduces that category's completion count.

## Local draft storage

Use IndexedDB rather than `localStorage`, because camera images commonly exceed localStorage's small synchronous quota. Store a versioned draft containing the contact fields, property address, compressed image blobs, category, photo type, custom name, description, capture timestamp, and a stable client-generated photo ID.

Before saving locally, normalize camera images to JPEG or WebP, correct orientation through browser decoding, constrain the longest edge to a sensible upload dimension, and target a practical file size without making inspection details unreadable. The implementation plan will set and test exact limits. If browser storage is unavailable or full, show an actionable message and do not mark that photo complete.

Drafts are scoped to Demo 5 and the normalized property address. The UI offers to restore a matching unfinished draft. A successful submission deletes its local draft; failed submission keeps it for retry. Avoid placing image blobs or private details in `localStorage`, URLs, logs, or analytics.

## Database and storage model

Use the two tables the owner created:

- `public.photographers` stores name, email, phone, payment method, and payment URL.
- `public.photographer_property_photos` stores `photographer_id`, property address, storage path in `photo`, custom `photo_name`, description, broad `photo_category`, and timestamps.

Add required `photo_type` and `condition_status` columns to `public.photographer_property_photos`. Broad values remain `exterior`, `interior`, `mechanical`, and `condition`; `photo_type` stores stable lowercase identifiers such as `hallway_room_layout` or `under_sink`; photographed items use `good_condition` or `damage`. User-facing labels are defined in shared application data rather than stored as presentation text.

Add `public.photographer_upload_sessions` to track opaque session IDs, photographer ownership, property address, status, idempotency key, a `not_applicable` JSON object containing feature IDs explicitly marked N/A, expiration, and timestamps. This table provides reliable signed-path validation, duplicate prevention, retry handling, N/A persistence, and abandoned-object cleanup without creating fake photo rows.

Create a private Supabase Storage bucket named `photographer-photos`. Object keys follow a server-authorized structure such as `{photographer_id}/{submission_id}/{client_photo_id}.jpg`. The database stores the object path, not a public URL. Retrieval will use authenticated or server-generated signed URLs in a later viewer.

The migration will be idempotent for the bucket and additive for `photo_type`, `condition_status`, and upload-session support. Existing RLS and revoked browser table access remain intact. The Supabase service-role key stays server-only.

## Submission flow

1. Client validates contact/payment fields, address, the 4/4/1/1 category minimums, and all draft metadata.
2. Client requests a submission session from a Demo 5 server endpoint.
3. Server validates the request, finds or creates the photographer by normalized email, updates the latest contact/payment fields when supplied, creates a random submission ID, and returns short-lived signed upload targets restricted to the private bucket paths.
4. Client uploads the locally stored, compressed images directly to Supabase Storage with bounded concurrency and visible per-file/overall progress. Direct signed uploads avoid serverless request-size limits and never expose the service-role key.
5. Client calls a finalize endpoint with the property address and metadata for the successfully uploaded object paths.
6. Server validates every path belongs to that submission session, rechecks category minimums, validates category/type/status combinations and text limits, verifies the objects exist and are images, then inserts all table-2 rows and N/A declarations in one database transaction.
7. On finalize success, client clears the IndexedDB draft and opens the existing confirmation dialog.

Storage and PostgreSQL cannot share one transaction. Failed uploads leave the draft untouched and can be retried. A failed finalize triggers best-effort deletion of objects uploaded for that session; the server also records enough session information for safe cleanup of abandoned objects. Repeating finalize must be idempotent so retries cannot create duplicate photo rows.

Because `photographers.email` is unique case-insensitively, repeat submissions reuse that photographer rather than creating duplicates. One photographer may therefore own unlimited photo rows across properties.

Demo 5 adds required Payment Method and Payment URL fields to the photographer-details section. Both values are validated on the client and server and stored in table 1. Repeat submissions update the photographer's current contact and payment details.

## API and security

- Add Demo 5-specific prepare/finalize endpoints; do not change the existing Google Drive submission endpoint used by Demo 4.
- Validate all values again on the server; client checklist state is not trusted.
- Permit only declared category/type combinations and image MIME types.
- Enforce per-photo and total-submission size/count limits.
- Generate object paths and signed upload tokens server-side.
- Use opaque, expiring submission-session identifiers and idempotency keys.
- Do not return permanent public image URLs.
- Rate-limit session creation and finalization sufficiently to limit abuse of an unauthenticated public form.
- Do not log contact details, addresses, signed URLs, image metadata, or service credentials.

## Failure and recovery behavior

- Camera permission denial explains how to enable access or choose an existing image.
- Invalid or oversized captures remain unsaved and do not complete checklist items.
- IndexedDB quota failure preserves existing drafts and explains that device space must be freed.
- Offline state allows continued capture and local saves but disables final submission with a clear message.
- Partial upload failure reports affected photos and retries only missing/failed uploads.
- Finalize failure retains the local draft and lets the photographer retry safely.
- Closing or refreshing restores the unfinished visit from IndexedDB.

## Accessibility and responsive behavior

Use native file inputs behind clearly labeled camera buttons, real labels for name/type/description fields, keyboard-operable controls, focus management when the capture editor opens, live regions for save/upload progress, text completion counts in addition to color, and descriptive alt text based on photo name/type. The workflow must fit narrow mobile screens and retain usable touch targets.

## Testing and verification

- Unit tests for category/type configuration, 4/4/1/1 completion rules, N/A declarations, validation, file-size/count rules, and payload normalization.
- IndexedDB integration tests for save, restore, delete, quota errors, and successful cleanup.
- API tests for prepare/finalize authorization, validation, idempotency, ownership, object verification, database writes, and cleanup behavior.
- Component/browser tests for camera fallback, classify/save, multiple photos, retake/remove, completion counts, refresh restoration, offline behavior, upload progress, failure retry, and confirmation timing.
- Regression checks proving Demo 4 still contains its Google Drive workflow and Demo 5 does not.
- Full test, lint, and production-build verification before deployment.

## Approaches considered

1. **IndexedDB draft, upload on final submit — selected.** Best match for field work and weak connectivity; requires local-draft management and a robust final upload sequence.
2. **Upload every saved photo immediately.** Uses less device storage, but makes capture dependent on connectivity and produces abandoned remote objects more often.
3. **Capture everything, classify afterward.** Faster for bulk shooting, but makes missed required shots more likely and provides less guidance onsite.

## Builder decisions

The builder may select a small, maintained IndexedDB wrapper or use the native API, choose exact compression dimensions/quality after testing representative phone images, choose bounded upload concurrency, and define internal component boundaries. These choices must preserve the behavior and security constraints above.
