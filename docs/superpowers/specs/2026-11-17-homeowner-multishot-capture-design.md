# Homeowner Multishot Capture Design

## Intent

Make property-photo capture simple for homeowners: select a broad area, take repeated photos, and have every shot save automatically without naming or classifying it further.

## Goals

- Present five choices: Exterior, Interior, Mechanical, Basement, and Other.
- Replace the current Condition category with Basement throughout the homeowner workflow.
- Require the homeowner to choose a category before opening the camera.
- Automatically prepare and save each successful shot to the selected category.
- Keep the selected category active and offer another shot immediately.
- Allow multi-select when uploading existing images.
- Keep photo review, removal, retakes, local draft persistence, minimum-count guidance, and final submission.

## Non-goals

- No photo name, photo type, condition status, or description entry by the homeowner.
- No attempt to force a native mobile camera into a browser-controlled continuous-shutter mode.
- No changes to homeowner contact fields or the final submission destination.

## Interaction

The photo step shows the five category choices above the capture controls. After selecting one, the homeowner taps **Take Photo** to open the native phone camera. When the browser receives an approved image, the app prepares it, generates its internal metadata, saves it to the local draft, updates the category count, and shows **Take Another Photo**. The chosen category remains active. There is no editor between capture and save.

**Upload Photos** accepts multiple existing images and processes them one at a time into the selected category. A failed image is reported without discarding images already saved from the same selection.

Retake replaces the selected photo automatically in its existing category. Viewing remains read-only, and removing a photo remains available.

## Data compatibility

The existing storage and submission schema still needs internal values. The app will generate a neutral photo name from the category and sequence, map each broad category to an internal compatible photo type, use a neutral internal condition value, and leave the description empty. Existing saved drafts and already-submitted records remain readable. The database classification migration will add Basement as a supported category while retaining legacy Condition records for compatibility.

## Validation

The existing required counts become four Exterior, four Interior, one Mechanical, and one Basement; Other remains optional. The selected category is required before capture or upload.

## Approaches considered

1. **Repeated mobile capture with immediate save — selected.** Reliable across mobile browsers and gives clear confirmation after every shot.
2. **A single multi-file camera input.** Useful for gallery selection but unreliable for continuous camera capture on mobile, so it is limited to Upload Photos.

## Verification

Tests will cover category-first capture, automatic metadata and persistence, repeated shots in one category, multi-image upload, retake replacement, Basement validation and migration compatibility, accessible controls, full regression tests, and a production build.
