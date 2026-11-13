# Demo 5 sample-based photo types

## Intent

Make the Demo 5 photo-type dropdowns match the terminology photographers already see in the sample galleries, and remind photographers to take landscape-oriented photos.

## Design

- Replace broad Exterior photo types with every caption shown in the Demo 5 Exterior sample gallery.
- Replace broad Interior photo types with every caption shown in the Interior sample gallery. Also include all Basement sample captions because Basement photos are stored under the Interior category, plus `Attic` and `Garage` so those existing interior features can still be labeled when present.
- Replace broad Mechanical photo types with every caption shown in the Mechanicals sample gallery.
- Keep the existing Condition choices (`General Condition`, `Damage`, `Repair Needed`, and `Other`) because Demo 5 has no Condition sample gallery.
- Keep `Other` in Exterior, Interior, and Mechanical as a safe fallback for legitimate photos not represented by a sample.
- Keep stable machine-readable values in `snake_case`; show the sample captions as human-readable labels in the editor.
- Preserve the current category minimums, N/A rules, storage schema, upload flow, camera capture behavior, and Choose Image behavior.
- Add visible guidance above the category controls: `Take all photos horizontally (landscape orientation).` This is advice, not a hard validation rule, so an essential portrait photo can still be saved.

## Approaches considered

1. Use every sample caption as a selectable photo type. Chosen because it gives photographers an exact match between the examples and the label they save.
2. Consolidate similar sample captions into broad types. Rejected because choices such as reverse views, appliance walls, and plumbing details would lose useful specificity.

## Verification

- Domain tests assert the exact available values and labels for every category.
- Form tests confirm the landscape guidance is visible and the editor renders the expanded dropdown options.
- Existing validation, draft storage, API, camera, and upload tests must continue to pass.
