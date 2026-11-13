# Demo 5 N/A Rules Design

## Intent

Exterior and Interior are mandatory property categories. Exterior must never offer N/A choices. Interior may offer N/A only for features a property may not have: Basement, Attic, and Garage.

## Behavior

- `Take Photo` keeps opening the device camera through `capture="environment"`.
- `Choose Image` keeps opening the gallery/file picker.
- Exterior has no `Mark feature N/A` disclosure.
- Interior keeps a collapsed disclosure containing only Basement, Attic, and Garage.
- Mechanical and Condition have no N/A disclosure.
- Photo minimums, labeling, drafts, uploads, and submission behavior remain unchanged.

## Approach

Change the shared `OPTIONAL_FEATURES` configuration so the UI, IndexedDB validation, and API validation all reject Exterior N/A values consistently. The already-deployed SQL function remains permissive for old Exterior N/A session data, but new application requests cannot create it; no database migration is required for this UI/business-rule correction.
