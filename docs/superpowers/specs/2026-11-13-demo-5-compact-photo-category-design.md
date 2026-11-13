# Demo 5 Compact Photo Category Design

## Intent

Reduce the vertical space used by each Demo 5 photo-category card on mobile. Before a photo is selected, the card should focus on the two primary actions: `Take Photo` and `Choose Image`. Photo labeling remains in the editor that opens after capture or selection.

## Behavior

- Keep the category name and completed/minimum count in the card header.
- Remove the always-visible list of photo types from every category card.
- Keep `Take Photo` and `Choose Image` as the only always-visible controls in an empty category card.
- Preserve the existing post-capture editor for photo name, photo type, condition, and description.
- Move optional feature exceptions into a compact collapsed `Mark feature N/A` disclosure below the two photo buttons.
- Only render that disclosure for categories that have optional features.
- Opening the disclosure reveals the existing N/A checkboxes; closing it hides them without changing their values.
- Saved photo thumbnails and their View, Retake, and Remove actions remain below the compact controls.
- Preserve the 4/4/1/1 photo minimums, IndexedDB drafts, submission behavior, accessibility labels, and camera/file-picker behavior.
- Do not alter Demo 4, the homepage, APIs, database schema, or Supabase Storage.

## Approaches

1. **Collapsed N/A disclosure — selected.** Keeps cards compact while preserving explicit property exceptions.
2. Put N/A choices inside the photo editor. Rejected because a property exception is not metadata for a captured photo.

## Verification

- Regression test that the type-hint list is absent from category cards.
- Regression test that N/A options are inside a closed-by-default disclosure.
- Browser check at phone width for compact spacing and operable disclosure.
- Full tests, lint, and production build before deployment.
