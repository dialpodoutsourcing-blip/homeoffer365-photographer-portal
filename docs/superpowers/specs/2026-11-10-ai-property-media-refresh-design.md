# AI Property Media Refresh Design

## Intent

Replace the current mixed property samples with the user-supplied training set showing one small American brick bungalow suited to Pennsylvania. The examples should help photographers understand complete exterior, interior, mechanical, street-view, and walkthrough coverage.

## Goals

- Show the supplied modest Pennsylvania-style house across all new media.
- Provide several exterior and interior images.
- Expand mechanical coverage beyond two examples using the four supplied equipment/detail views.
- Provide playable MP4 examples for a 360-style street view and a continuous outside-to-inside property tour.
- Replace the relevant Demo 4 samples and shared photo-guide examples without presenting the imagery as an inspected property.

## Non-goals

- The street-view video is not an interactive map or geolocated record.
- The examples are not evidence of verified equipment installation or condition.
- No unrelated redesign of the photographer portal is included.

## Constraints

- Generated media must depict a small, believable American house suited to Pennsylvania's rolling, wooded topography.
- All images must be free of people, logos, text, watermarks, and implausible luxury features.
- Video generation is not available in the current toolset, so MP4s will be assembled from coherent AI-generated frames with restrained camera motion and transitions.
- Existing user changes in the dirty worktree must be preserved.
- Next.js 16.4.5 project guidance in `node_modules/next/dist/docs/` must be consulted before code changes.

## Approaches

1. **One coherent property (selected):** generate every gallery and video frame around the same house, rooms, materials, and systems. This creates the most believable training example.
2. **Several properties:** greater variety, but the galleries and videos no longer read as one real visit.
3. **Hybrid real Street View:** retains a geolocated embed, but conflicts with the request for AI-generated replacement media.

## Design

Create a project-local `pennsylvania-brick-bungalow` media collection with descriptive filenames. Update central content data and Demo 4 gallery data to use it. Mechanical examples will include the furnace/ductwork, exterior electrical meter context, close electrical meter view, and under-sink plumbing. The street-view MP4 will orbit the supplied exterior angles; the tour MP4 will establish the exterior, then progress through the living room, kitchen, bedroom, bathroom, laundry, basement furnace, plumbing, and rear exterior.

## Success Criteria

The app builds and tests pass; no targeted UI references the replaced equity-drive sample set; Demo 4 exposes five exterior, five interior, and four mechanical images; both generated MP4s are playable and project-local; assets are committed and pushed.
