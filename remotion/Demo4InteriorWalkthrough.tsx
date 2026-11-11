import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

import {
  getSceneOpacity,
  SCENE_FRAMES,
  TRANSITION_FRAMES,
  WALKTHROUGH_SCENES,
} from "./walkthrough-manifest.mjs";

export const Demo4InteriorWalkthrough = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#ece5da", overflow: "hidden" }}>
      {WALKTHROUGH_SCENES.map((scene, index) => {
        const start = index * SCENE_FRAMES;
        const localFrame = frame - start;
        const isFirst = index === 0;
        const isLast = index === WALKTHROUGH_SCENES.length - 1;
        const progress = interpolate(localFrame, [0, SCENE_FRAMES], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const scale = interpolate(progress, [0, 1], [1.035, 1.105]);
        const translateX = interpolate(progress, [0, 1], [-scene.panX, scene.panX]);
        const translateY = interpolate(progress, [0, 1], [-scene.panY, scene.panY]);

        if (localFrame < 0 || localFrame > SCENE_FRAMES + TRANSITION_FRAMES)
          return null;

        return (
          <AbsoluteFill
            key={scene.id}
            style={{ opacity: getSceneOpacity(localFrame, isFirst, isLast) }}
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
