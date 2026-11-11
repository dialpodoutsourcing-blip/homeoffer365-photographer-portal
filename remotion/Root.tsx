import { Composition } from "remotion";

import { Demo4ExteriorWalkthrough } from "./Demo4ExteriorWalkthrough";
import { Demo4InteriorWalkthrough } from "./Demo4InteriorWalkthrough";
import {
  EXTERIOR_FPS,
  EXTERIOR_HEIGHT,
  EXTERIOR_TOTAL_FRAMES,
  EXTERIOR_WIDTH,
} from "./exterior-walkthrough-manifest.mjs";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./walkthrough-manifest.mjs";

export const RemotionRoot = () => (
  <>
    <Composition
      id="Demo4InteriorWalkthrough"
      component={Demo4InteriorWalkthrough}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="Demo4ExteriorWalkthrough"
      component={Demo4ExteriorWalkthrough}
      durationInFrames={EXTERIOR_TOTAL_FRAMES}
      fps={EXTERIOR_FPS}
      width={EXTERIOR_WIDTH}
      height={EXTERIOR_HEIGHT}
    />
  </>
);
