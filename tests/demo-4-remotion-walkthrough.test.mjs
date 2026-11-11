import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

import {
  FPS,
  getSceneOpacity,
  TOTAL_FRAMES,
  WALKTHROUGH_SCENES,
} from "../remotion/walkthrough-manifest.mjs";

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
  const previousSceneOpacity = getSceneOpacity(200, false, false);
  const nextSceneOpacity = getSceneOpacity(0, false, false);

  assert.ok(previousSceneOpacity + nextSceneOpacity >= 1);
});

test("walkthrough uses existing local images and no overlays", () => {
  for (const scene of WALKTHROUGH_SCENES) {
    assert.equal(scene.overlay, null);
    assert.ok(existsSync(`public/${scene.src}`), `missing ${scene.src}`);
  }
});
