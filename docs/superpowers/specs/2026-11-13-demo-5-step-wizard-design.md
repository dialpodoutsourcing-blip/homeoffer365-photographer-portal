# Demo 5 three-step photo submission wizard

## Intent

Replace the long Demo 5 form and four repeated capture panels with a polished mobile-first wizard. Photographers enter information in small steps, use one shared camera/upload area, classify each photo after capture, and review saved photos in category tabs.

## Approved flow

### Step 1 — Your information

- Photographer’s Name
- Email
- Phone
- One primary button labeled `Next`
- Validate only these fields before advancing.

### Step 2 — Payment information

- Payment Method
- Payment URL
- `Back` and one primary button labeled `Next`
- Validate only these fields before advancing.

### Step 3 — Property photos

- Property Address with the current Pennsylvania locality suggestions
- Landscape-orientation guidance
- One shared `Take Photo` button that opens the rear-facing camera
- One shared `Upload Image` button that opens the image picker
- No separate capture controls inside category cards
- `Back` and `Submit All Photos` actions

## Post-capture editor

After a photo is taken or selected, open the editor and ask for:

1. Photo Name
2. Category: Exterior, Interior, Mechanical, Condition, or Other
3. Photo Type, dynamically populated from the selected category
4. Condition Status using the approved six inspector statuses
5. Optional Description

The capture starts without a category. The photographer selects the category only after seeing the photo. Retaking a saved photo preserves its current category unless the photographer changes it.

`Other` is an optional fifth category with the single photo type `Other`; it has no required minimum and no N/A choices.

## Saved-photo organization

- Show category tabs below the shared capture area: Exterior, Interior, Mechanical, Condition, and Other.
- Each tab displays its saved-photo count and only that category’s photo cards.
- A saved photo card shows thumbnail, name, photo type, condition status, and View, Retake, and Remove actions.
- Saving a photo activates its selected category tab and places the card there immediately.
- Empty tabs show a short category-specific empty state.
- Keep Interior’s Basement, Attic, and Garage N/A controls inside the Interior tab; Exterior, Mechanical, Condition, and Other cannot be marked N/A.

## Progress and validation

- Show `Step 1 of 3`, `Step 2 of 3`, or `Step 3 of 3` and a three-segment progress indicator.
- Preserve required minimums: 4 Exterior, 4 Interior, 1 Mechanical, and 1 Condition. Other remains optional.
- N/A selections never replace required photos.
- Submission remains unavailable until all contact, payment, address, photo metadata, and minimum requirements are valid.
- Back/Next navigation preserves all entered and locally saved information.
- Draft restoration returns to Step 3 when the restored draft already contains an address or photos; otherwise it opens the earliest incomplete step.

## Visual design

- Use a focused card-like wizard surface within the existing Demo 5 page, not a full-page replacement.
- Keep field groups single-column on phones with at least 44px controls and 16px editable text.
- Use stronger section hierarchy, restrained Home Offer 365 blue accents, generous vertical spacing, and one obvious primary action per step.
- Keep Back visually secondary.
- Use compact pill-style category tabs that can wrap on small screens rather than forcing horizontal page overflow.
- Use consistent 10–14px radii, subtle borders, and low-contrast shadows; avoid excessive nested cards.
- Keep all controls keyboard accessible with visible focus and status/error announcements.

## Architecture and compatibility

- Extend `PhotoCategory` with `other` and add `PHOTO_MINIMUMS.other = 0` plus `PHOTO_TYPES.other = ["other"]`.
- Update application, IndexedDB, API, and database validation to accept `other` without lowering existing category minimums.
- Refactor capture ownership from `DemoFivePhotoCategory` into the form’s shared capture area.
- Make the editor’s category selectable for new photos and editable on retake.
- Reuse the existing preparation, local persistence, upload, retry, confirmation, and camera cancellation behavior.
- Add a forward SQL migration; preserve all previously valid drafts and submissions.

## Approaches considered

1. Three-step wizard with one shared capture area and tabbed review. Chosen because it matches the approved mockup and removes repeated controls.
2. Keep the long form and only collapse sections. Rejected because it does not simplify capture or move classification after the photo.
3. Keep category cards but add a stepper above them. Rejected because repeated camera/upload controls remain and classification still happens too early.

## Verification

- Reducer/domain tests cover step navigation, per-step validation, Other category behavior, retake category changes, and minimums.
- Rendered form/editor tests cover exact fields per step, simple `Next` labels, shared capture controls, post-capture category selection, tabs, cards, and N/A placement.
- Draft/API/PGlite tests cover Other persistence and the forward migration.
- Mobile browser checks at 390×844 exercise all steps, capture/upload, labeling, tab switching, retake/remove, focus, and overflow.
