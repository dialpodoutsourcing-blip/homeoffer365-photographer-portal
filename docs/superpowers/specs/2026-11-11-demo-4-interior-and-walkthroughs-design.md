# Demo 4 Interior Coverage and Walkthrough Videos Design

## Intent

Complete Demo 4's interior gallery as a believable agent-led property review and change the existing "Video Tour" presentation into the two continuous video walkthroughs required by the meeting notes.

## Goals

- Keep the change limited to Demo 4.
- Add four matching interior views: dining area, hallway/room connection, second bedroom, and bathroom vanity with its cabinet open to show the under-sink plumbing.
- Retain the existing kitchen under-sink image and distinguish it from the bathroom vanity plumbing image.
- Order Interior as a natural room-to-room walkthrough: living room, dining area, hallway/layout, kitchen, kitchen under-sink, primary bedroom, second bedroom, bathroom, bathroom vanity plumbing, and laundry.
- Rename the "Video Tours" tab to "Video Walkthroughs."
- Keep the video feature, changing the single "Full Property Video Tour" presentation into two separately playable videos labeled "Exterior Video Walkthrough" and "Interior Video Walkthrough."
- Describe both videos as continuous walkthroughs, matching the meeting requirement and avoiding slideshow/tour terminology.

## Non-goals

- Do not change the Street View sample, shared photo guide, upload workflow, or other Demo pages.
- Do not represent generated still images as inspection evidence.
- Do not remove the video feature; change its terminology and presentation to video walkthroughs.

## Constraints

- New still images must match the same modest Pennsylvania brick bungalow, room finishes, daylight, and MLS photography style.
- New images must contain no people, text, logos, or watermarks.
- Walkthrough videos must use playable project-local MP4 files and must not be presented as slideshows.
- Existing unrelated worktree changes must remain untouched.
- Follow the installed Next.js 16.4.5 image and media conventions.

## Approaches

1. Add only generic room labels while reusing the six existing images. Rejected because it would not supply the visibly missing rooms and bathroom vanity detail.
2. Add four coherent interior stills and present two separate existing continuous MP4 walkthroughs. Selected because it satisfies the meeting notes with focused new media and preserves real continuous motion.
3. Generate a completely new interior set and synthetic videos. Rejected because it would replace good imagery and risks producing slideshow-like video that conflicts with the meeting.

## Selected Design

Generate four still images using the existing living room, kitchen, bedroom, bathroom, and exterior images as identity references. Add them only to Demo 4's Interior gallery in room-to-room order. Keep the existing video area, rename it "Video Walkthroughs," and render two native video elements: one exterior video walkthrough and one interior video walkthrough, each with its own poster, accessible label, heading, and concise continuous-movement description. Select the best existing real-motion project-local clips after frame inspection; do not use the AI property slideshow as either walkthrough.

## Verification

- Add a failing regression test for the exact interior image order, both distinct under-sink labels, the "Video Walkthroughs" tab, two video elements, approved walkthrough labels, and the terminology change from "Video Tour" to "Video Walkthrough."
- Confirm all four generated image files and both MP4 files exist and are non-empty.
- Run the focused test, full test suite, lint, production build, and diff check.
