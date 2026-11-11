import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import {
  FPS,
  getSceneOpacity,
  TOTAL_FRAMES,
  WALKTHROUGH_SCENES,
} from "../remotion/walkthrough-manifest.mjs";
import {
  EXTERIOR_END_SCALE,
  EXTERIOR_FPS,
  EXTERIOR_SCENE_FRAMES,
  EXTERIOR_START_SCALE,
  EXTERIOR_TOTAL_FRAMES,
  EXTERIOR_TRANSITION_FRAMES,
  EXTERIOR_WALKTHROUGH_SCENES,
  getExteriorSceneOpacity,
} from "../remotion/exterior-walkthrough-manifest.mjs";
import {
  WALKING_BOB_AMPLITUDE,
  WALKING_END_SCALE,
  WALKING_START_SCALE,
  getWalkingOffset,
} from "../remotion/walking-motion.mjs";

test("walkthrough manifest covers the approved nine-room route in 60 seconds", () => {
  assert.equal(FPS, 30);
  assert.equal(TOTAL_FRAMES, 1800);
  assert.deepEqual(
    WALKTHROUGH_SCENES.map(({ id }) => id),
    [
      "entry",
      "living-room",
      "dining-area",
      "kitchen",
      "hallway",
      "primary-bedroom",
      "second-bedroom",
      "bathroom",
      "laundry-utility",
    ],
  );
  assert.equal(
    WALKTHROUGH_SCENES.reduce((sum, scene) => sum + scene.frames, 0),
    TOTAL_FRAMES,
  );
});

test("scene boundaries retain a fully covered frame during crossfades", () => {
  for (let transitionFrame = 0; transitionFrame <= 28; transitionFrame += 1) {
    const outgoing = getSceneOpacity(200 + transitionFrame, false, false);
    const incoming = getSceneOpacity(transitionFrame, false, false);
    const compositedCoverage = 1 - (1 - outgoing) * (1 - incoming);

    assert.equal(compositedCoverage, 1, `under-covered frame ${transitionFrame}`);
  }
});

test("the Next app and Remotion use separate TypeScript projects", () => {
  const appTsconfig = JSON.parse(readFileSync("tsconfig.json", "utf8"));
  const remotionPackage = JSON.parse(
    readFileSync("remotion/package.json", "utf8"),
  );

  assert.ok(appTsconfig.exclude.includes("remotion"));
  assert.equal(remotionPackage.scripts.typecheck, "tsc --noEmit");
  assert.ok(existsSync("remotion/tsconfig.json"));
});

test("walkthrough uses existing local images and no overlays", () => {
  for (const scene of WALKTHROUGH_SCENES) {
    assert.equal(scene.overlay, null);
    assert.ok(existsSync(`public/${scene.src}`), `missing ${scene.src}`);
  }
});

test("exterior walkthrough uses a strong nine-view forward route", () => {
  assert.equal(EXTERIOR_START_SCALE, 1.025);
  assert.equal(EXTERIOR_END_SCALE, 1.24);
  assert.deepEqual(
    EXTERIOR_WALKTHROUGH_SCENES.map(({ id }) => id),
    [
      "front",
      "front-driveway",
      "side-yard",
      "rear-side",
      "fence-boundary",
      "rear",
      "ac-condenser",
      "electrical-service",
      "electric-meter",
    ],
  );
  assert.equal(
    EXTERIOR_WALKTHROUGH_SCENES.reduce((sum, scene) => sum + scene.frames, 0),
    EXTERIOR_TOTAL_FRAMES,
  );

  for (const scene of EXTERIOR_WALKTHROUGH_SCENES) {
    assert.equal(scene.frames, EXTERIOR_SCENE_FRAMES);
    assert.equal(scene.overlay, null);
    assert.ok(existsSync(`public/${scene.src}`), `missing ${scene.src}`);
  }
});

test("exterior crossfades retain full frame coverage", () => {
  for (
    let transitionFrame = 0;
    transitionFrame <= EXTERIOR_TRANSITION_FRAMES;
    transitionFrame += 1
  ) {
    const outgoing = getExteriorSceneOpacity(
      EXTERIOR_SCENE_FRAMES + transitionFrame,
      false,
      false,
    );
    const incoming = getExteriorSceneOpacity(transitionFrame, false, false);
    const compositedCoverage = 1 - (1 - outgoing) * (1 - incoming);

    assert.equal(compositedCoverage, 1, `under-covered frame ${transitionFrame}`);
  }
});

test("both tours use continuous first-person walking motion for one minute", () => {
  assert.equal(TOTAL_FRAMES, FPS * 60);
  assert.equal(EXTERIOR_TOTAL_FRAMES, EXTERIOR_FPS * 60);
  assert.equal(WALKING_START_SCALE, 1.025);
  assert.equal(WALKING_END_SCALE, 1.24);
  assert.ok(WALKING_BOB_AMPLITUDE > 0);

  const quarterStep = getWalkingOffset(5, 30);
  const halfStep = getWalkingOffset(10, 30);
  assert.notEqual(quarterStep.y, halfStep.y);
  assert.notEqual(quarterStep.x, halfStep.x);
});

test("interior and exterior routes visit every required area", () => {
  assert.deepEqual(
    WALKTHROUGH_SCENES.map(({ id }) => id),
    [
      "entry",
      "living-room",
      "dining-area",
      "kitchen",
      "hallway",
      "primary-bedroom",
      "second-bedroom",
      "bathroom",
      "laundry-utility",
    ],
  );
  assert.deepEqual(
    EXTERIOR_WALKTHROUGH_SCENES.map(({ id }) => id),
    [
      "front",
      "front-driveway",
      "side-yard",
      "rear-side",
      "fence-boundary",
      "rear",
      "ac-condenser",
      "electrical-service",
      "electric-meter",
    ],
  );
});
