import { Composition } from "remotion";

import { Demo4InteriorWalkthrough } from "./Demo4InteriorWalkthrough";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./walkthrough-manifest.mjs";

export const RemotionRoot = () => (
  <Composition
    id="Demo4InteriorWalkthrough"
    component={Demo4InteriorWalkthrough}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
