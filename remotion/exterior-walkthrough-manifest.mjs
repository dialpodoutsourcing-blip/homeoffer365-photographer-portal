export const EXTERIOR_FPS = 30;
export const EXTERIOR_WIDTH = 1920;
export const EXTERIOR_HEIGHT = 1080;
export const EXTERIOR_SCENE_FRAMES = 180;
export const EXTERIOR_TRANSITION_FRAMES = 24;
export const EXTERIOR_START_SCALE = 1.04;
export const EXTERIOR_END_SCALE = 1.2;

const smoothstep = (value) => value * value * (3 - 2 * value);

export const getExteriorSceneOpacity = (localFrame, isFirst, _isLast) => {
  const fadeIn = isFirst
    ? 1
    : smoothstep(
        Math.max(0, Math.min(1, localFrame / EXTERIOR_TRANSITION_FRAMES)),
      );

  return fadeIn;
};

export const EXTERIOR_WALKTHROUGH_SCENES = [
  {
    id: "front",
    src: "images/photo-examples/pennsylvania-brick-bungalow/exterior-front.png",
    frames: EXTERIOR_SCENE_FRAMES,
    panX: 0,
    panY: -0.25,
    overlay: null,
  },
  {
    id: "front-driveway",
    src: "images/photo-examples/pennsylvania-brick-bungalow/exterior-front-driveway.png",
    frames: EXTERIOR_SCENE_FRAMES,
    panX: 0.55,
    panY: -0.15,
    overlay: null,
  },
  {
    id: "side-yard",
    src: "images/photo-examples/pennsylvania-brick-bungalow/exterior-side-yard.png",
    frames: EXTERIOR_SCENE_FRAMES,
    panX: -0.45,
    panY: 0,
    overlay: null,
  },
  {
    id: "rear-side",
    src: "images/photo-examples/pennsylvania-brick-bungalow/exterior-rear-side.png",
    frames: EXTERIOR_SCENE_FRAMES,
    panX: 0.45,
    panY: -0.1,
    overlay: null,
  },
  {
    id: "fence-boundary",
    src: "images/photo-examples/pennsylvania-brick-bungalow/exterior-fence-property-boundary.png",
    frames: EXTERIOR_SCENE_FRAMES,
    panX: -0.4,
    panY: 0.05,
    overlay: null,
  },
  {
    id: "rear",
    src: "images/photo-examples/pennsylvania-brick-bungalow/exterior-rear.png",
    frames: EXTERIOR_SCENE_FRAMES,
    panX: 0,
    panY: -0.2,
    overlay: null,
  },
];

export const EXTERIOR_TOTAL_FRAMES = EXTERIOR_WALKTHROUGH_SCENES.reduce(
  (sum, scene) => sum + scene.frames,
  0,
);
