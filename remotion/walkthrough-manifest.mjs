export const FPS = 30;
export const TOTAL_FRAMES = 1800;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const SCENE_FRAMES = 200;
export const TRANSITION_FRAMES = 28;

const smoothstep = (value) => value * value * (3 - 2 * value);

export const getSceneOpacity = (localFrame, isFirst, isLast) => {
  const fadeIn = isFirst
    ? 1
    : smoothstep(Math.max(0, Math.min(1, localFrame / TRANSITION_FRAMES)));
  const fadeOut = isLast
    ? 1
    : 1 -
      smoothstep(
        Math.max(
          0,
          Math.min(1, (localFrame - SCENE_FRAMES) / TRANSITION_FRAMES),
        ),
      );

  return Math.min(fadeIn, fadeOut);
};

export const WALKTHROUGH_SCENES = [
  { id: "entry", src: "images/photo-examples/demo-4-walkthrough/01-entry-living.png", frames: 200, panX: -1.2, panY: 0.4, overlay: null },
  { id: "living-room", src: "images/photo-examples/demo-4-walkthrough/02-living.png", frames: 200, panX: 1.2, panY: 0, overlay: null },
  { id: "dining-area", src: "images/photo-examples/demo-4-walkthrough/03-dining.png", frames: 200, panX: -0.7, panY: 0.2, overlay: null },
  { id: "kitchen", src: "images/photo-examples/demo-4-walkthrough/04-kitchen.png", frames: 200, panX: 0.8, panY: 0.3, overlay: null },
  { id: "hallway", src: "images/photo-examples/demo-4-walkthrough/05-hallway.png", frames: 200, panX: 0, panY: -0.5, overlay: null },
  { id: "primary-bedroom", src: "images/photo-examples/demo-4-walkthrough/06-primary-bedroom.png", frames: 200, panX: -1, panY: 0.2, overlay: null },
  { id: "second-bedroom", src: "images/photo-examples/demo-4-walkthrough/07-second-bedroom.png", frames: 200, panX: 1, panY: 0.2, overlay: null },
  { id: "bathroom", src: "images/photo-examples/demo-4-walkthrough/08-bathroom.png", frames: 200, panX: -0.5, panY: 0.3, overlay: null },
  { id: "laundry-utility", src: "images/photo-examples/demo-4-walkthrough/09-laundry-utility.png", frames: 200, panX: 0.6, panY: 0.1, overlay: null },
];
