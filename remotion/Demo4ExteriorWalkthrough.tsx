import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

import {
  EXTERIOR_END_SCALE,
  EXTERIOR_SCENE_FRAMES,
  EXTERIOR_START_SCALE,
  EXTERIOR_TRANSITION_FRAMES,
  EXTERIOR_WALKTHROUGH_SCENES,
  getExteriorSceneOpacity,
} from "./exterior-walkthrough-manifest.mjs";

export const Demo4ExteriorWalkthrough = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#d8ded2", overflow: "hidden" }}>
      {EXTERIOR_WALKTHROUGH_SCENES.map((scene, index) => {
        const start = index * EXTERIOR_SCENE_FRAMES;
        const localFrame = frame - start;
        const isFirst = index === 0;
        const isLast = index === EXTERIOR_WALKTHROUGH_SCENES.length - 1;
        const progress = interpolate(
          localFrame,
          [0, EXTERIOR_SCENE_FRAMES],
          [0, 1],
          {
            easing: Easing.inOut(Easing.cubic),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );
        const scale = interpolate(
          progress,
          [0, 1],
          [EXTERIOR_START_SCALE, EXTERIOR_END_SCALE],
        );
        const translateX = interpolate(
          progress,
          [0, 1],
          [-scene.panX, scene.panX],
        );
        const translateY = interpolate(
          progress,
          [0, 1],
          [-scene.panY, scene.panY],
        );

        if (
          localFrame < 0 ||
          localFrame > EXTERIOR_SCENE_FRAMES + EXTERIOR_TRANSITION_FRAMES
        )
          return null;

        return (
          <AbsoluteFill
            key={scene.id}
            style={{
              opacity: getExteriorSceneOpacity(localFrame, isFirst, isLast),
            }}
          >
            <Img
              src={staticFile(scene.src)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `translate3d(${translateX}%, ${translateY}%, 0) scale(${scale})`,
                transformOrigin: "center center",
              }}
            />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
