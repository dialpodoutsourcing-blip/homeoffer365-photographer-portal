# Demo 5 inspector-style condition statuses

## Intent

Give photographers a practical inspector-style condition assessment for every photo instead of limiting them to `Good Condition` or `Damage`.

## Statuses

- `good_condition` — **Good Condition:** Functional with no visible concerns.
- `satisfactory` — **Satisfactory:** Functional with normal wear for its age.
- `needs_maintenance` — **Needs Maintenance:** Usable, but maintenance or attention is recommended.
- `damage` — **Damaged:** Visible damage that requires repair.
- `non_functional` — **Non-Functional / Unusable:** Not working, unsafe, or not usable as intended.
- `not_accessible` — **Not Accessible:** The area or item could not be reached or its condition could not be confirmed.

## Behavior

- Replace the two-choice condition-status dropdown with all six statuses for every Exterior, Interior, Mechanical, and Condition photo.
- Display the selected status label and a concise definition in the editor so photographers can classify consistently.
- Keep the Description field available for specific observations. When `Not Accessible` is selected, prompt the photographer to explain why in Description, but do not make the description technically required in this change.
- Preserve existing `good_condition` and `damage` drafts and submissions without migration or relabeling.
- Add the four new values to application validation, local draft restoration, API validation, and the hosted database constraint through a forward SQL migration.
- Do not change photo types, category minimums, N/A rules, camera behavior, image selection, or upload flow.

## Approaches considered

1. Expand the condition status attached to every photo. Chosen because every property photo can carry a consistent assessment.
2. Add these terms only as photo types under the Condition category. Rejected because Exterior, Interior, and Mechanical photos would still have only the old two-state assessment.

## Verification

- Domain tests accept exactly the six approved statuses and reject spoofed values.
- Editor tests confirm all labels and definitions are visible and saved correctly.
- Draft, API, and embedded PostgreSQL tests confirm all six values persist while legacy values remain valid.
- Mobile browser verification confirms the expanded dropdown remains usable without horizontal overflow.
