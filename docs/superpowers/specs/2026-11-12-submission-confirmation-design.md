# Full-screen submission confirmation

## Intent

After a photographer successfully submits the form, replace the small inline receipt with a polished, reassuring full-screen confirmation based on the approved mockup. The confirmation should thank the photographer, explain what happens next, and feel consistent with Home Offer 365.

## Goals

- Cover the viewport after a confirmed successful submission.
- Fit within the available viewport without page scrolling, including shorter phone screens.
- Use the approved blue curved photo treatment, official Ashley Sellers portrait, green success mark, concise payment/review messaging, and branded Ashley footer.
- Animate the success mark once: the green circle enters, the check draws, and the rays appear.
- Provide one accessible close button in the upper-right.

## Non-goals

- No property-address autocomplete work in this change.
- No top navigation, large Home Offer 365 logo, menu, or back button.
- No looping GIF, animated WebP, animation library, or additional runtime dependency.
- No change to submission storage or email notification behavior.

## Behavior

- The confirmation appears only after `/api/submissions` returns success.
- It is implemented as a fixed full-screen overlay above the existing page.
- While open, the underlying page cannot scroll.
- Closing it resets the successfully submitted form and returns the photographer to a fresh form.
- The overlay is keyboard accessible, the close control has an accessible label, focus moves into the confirmation, and Escape closes it.
- Reduced-motion users see the final success mark without animation.
- Responsive sizing and spacing compress the composition on short screens so the confirmation remains scroll-free.

## Approaches considered

1. **Fixed full-screen overlay (selected):** guarantees the full-screen treatment, preserves the page underneath, and gives the close button a clear return destination.
2. **Replace the form inline:** simpler state rendering, but it would inherit page layout and scrolling and make the close behavior less natural.
3. **Separate confirmation route:** creates a clean page boundary, but adds navigation complexity and makes the submission receipt easier to revisit accidentally.

For the success animation, an inline SVG with CSS is selected over GIF or animated WebP because it is smaller, sharp at every size, themeable, and can honor reduced-motion preferences.

## Visual source

The approved throwaway mockup is `.codex-mockups/submission-confirmation.html`, rendered as `.codex-mockups/submission-confirmation.png`. Product implementation will reproduce the design within the existing component and stylesheet system rather than ship the mockup file.
