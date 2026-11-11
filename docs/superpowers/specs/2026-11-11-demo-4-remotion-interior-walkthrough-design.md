# Demo 4 Remotion Interior Walkthrough Design

## Intent

Replace Demo 4's messy interior video with a clean, pleasing, no-people walkthrough that helps a photographer understand what a complete small-house interior tour should show.

## Goals

- Deliver a 55–65 second, 16:9, web-optimized MP4 and matching poster.
- Present one visually consistent, modest American house rather than a luxury property.
- Follow this route: entry, living room, dining area, kitchen, hallway, primary bedroom, second bedroom, bathroom, and laundry/utility area.
- Keep rooms clean and lightly staged while retaining realistic scale and everyday finishes.
- Use Remotion for smooth forward movement, subtle turns, doorway transitions, and gentle stabilization.
- Replace only Demo 4's interior walkthrough; preserve its exterior walkthrough.

## Non-goals

- This is not a measured scan or physically accurate reconstruction of a real listing.
- No people, captions, logos, voice-over, or visible camera operator.
- Do not present a large, luxurious, or showroom-perfect home.

## Constraints

- Generated scenes must share architecture, flooring, wall colors, trim, daylight, and furnishing language.
- The final output must be practical for the existing Next.js/Vercel site.
- Existing unrelated worktree changes must be preserved.

## Approaches

1. Animate existing Demo 4 photographs. Rejected because the source interior remains cluttered and lacks overlapping viewpoints.
2. Generate consistent clean room scenes and animate them in Remotion. Selected because it provides the requested cleanliness, room coverage, and no-people presentation.

## Limitation

The result is a convincing simulated walkthrough assembled from generated scenes, not continuous footage captured inside a physical house.
