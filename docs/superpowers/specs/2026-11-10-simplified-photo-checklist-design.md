# Simplified Photo Checklist Design

## Intent

Make Demo 3's photo checklist easier to scan without removing its collapsible interaction or any checklist content.

## Approved approach

Use a compact, single-column accordion list. Shorten the introduction, remove the visible section numbers and item counts, and show only each category title with its plus/minus control. Keep all checklist items inside their existing expandable panels.

## Constraints

- Preserve native `details`/`summary` keyboard accessibility.
- Preserve all five checklist categories and every checklist item.
- Keep the first category open initially.
- Apply the presentation consistently wherever the shared photographer landing checklist renders.
- Do not add dependencies or change submission behavior.

## Alternatives considered

- A permanently visible flat checklist was rejected because the accordion interaction must remain.
- Keeping the two-column cards with lighter styling was rejected in favor of the simpler single-column scan path.
