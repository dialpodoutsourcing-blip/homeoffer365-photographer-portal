# Demo 5 Payment and Review Polish Design

## Intent

Make Demo 5 easier and more professional for photographers using phones. Payment Method becomes a required native dropdown, and the photo-review summary becomes a cleaner, balanced mobile panel without changing submission data or photo requirements.

## Approved approach

Use the existing form and draft model. Replace only the free-text payment control with a native select containing ACH / Bank Transfer, Zelle, Venmo, PayPal, Cash App, Check, and Other. Keep saving its value to the existing `paymentMethod` / `payment_method` field, so no database migration is required.

Restyle the existing photo-review header, requirement summary, category tabs, and active-category heading. Preserve all category counts, minimums, N/A rules, tab semantics, photo behavior, and submission behavior. Favor a compact card, a concise requirements line, evenly sized responsive tabs, and clearer visual hierarchy at narrow mobile widths.

## Alternatives considered

- Native select (chosen): accessible, compact, reliable on phones, and compatible with existing storage.
- Custom dropdown: more visual control but unnecessary JavaScript and accessibility risk.
- Radio buttons: immediately visible but uses too much mobile space.

## Constraints

- No SQL changes.
- Existing drafts and stored payment values must remain usable.
- No new dependency.
- Mobile widths down to 320px must not overflow.
