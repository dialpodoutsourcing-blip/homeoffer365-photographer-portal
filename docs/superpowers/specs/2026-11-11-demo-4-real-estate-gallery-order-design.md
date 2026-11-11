# Demo 4 Real-Estate Gallery Order Design

## Intent

Organize Demo 4's property imagery the way a real-estate agent would present and evaluate a home, so exterior, interior, and mechanical photos appear in the correct categories and in a natural tour order.

## Goals

- Keep the change limited to Demo 4.
- Move under-sink plumbing from Mechanicals to Interior.
- Move the exterior AC condenser, electrical meter, and exterior electrical-service context from Mechanicals to Exterior.
- Order Exterior as a physical walk around the property: front, driveway/side, property boundary or fence, rear, then exterior utilities.
- Order Interior room by room, keeping under-sink plumbing immediately after the kitchen.
- Keep Mechanicals focused on indoor systems: basement overview, furnace and ductwork, modern furnace, water heater, water softener, well pump, and indoor breaker panel.
- Generate only missing property-boundary/fence coverage, matching the existing Pennsylvania brick bungalow.

## Non-goals

- Do not change the main photo guide, shared slider, upload categories, or submission workflow.
- Do not regenerate usable existing photos or redesign Demo 4.
- Do not represent generated samples as inspection evidence.

## Constraints

- New imagery must match the same modest brick bungalow, landscaping, lighting, and realistic Pennsylvania setting.
- Images must contain no people, text, logos, or watermarks.
- Existing unrelated worktree changes must remain untouched.
- Demo 4 must continue using the installed Next.js image conventions and accessible labels.

## Approaches

1. Re-sort existing photos only. Rejected because exterior property-boundary coverage would remain incomplete.
2. Re-sort existing photos and generate only missing exterior coverage. Selected because it fixes classification and produces a complete, believable tour without replacing good assets.
3. Generate a complete replacement set. Rejected as unnecessary and more likely to introduce visual inconsistency.

## Selected Design

Update only `DemoFourSamples`. Add one matching fence/property-boundary image to Exterior, then arrange existing exterior utility photos after the general exterior walkaround. Place the under-sink detail directly after the kitchen in Interior. Remove all outdoor equipment from Mechanicals and order the remaining indoor systems from overview to individual components. Add focused regression assertions for category membership, exclusions, and sequence.

## Verification

- Confirm Demo 4 category arrays contain the intended files in tour order.
- Confirm under-sink plumbing is absent from Mechanicals.
- Confirm AC condenser and exterior electrical images are absent from Mechanicals.
- Confirm the generated fence image exists and is referenced by Demo 4.
- Run focused tests, the full test suite, lint, and a production build.
