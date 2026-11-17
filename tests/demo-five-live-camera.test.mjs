import assert from "node:assert/strict";
import test from "node:test";
import { CAMERA_CONSTRAINTS, captureVideoFrame, stopMediaStream } from "../lib/demo-five/live-camera.ts";

test("live camera prefers the rear camera without requesting audio", () => {
  assert.deepEqual(CAMERA_CONSTRAINTS, { audio: false, video: { facingMode: { ideal: "environment" } } });
});

test("a ready video frame becomes a timestamped JPEG file", async () => {
  const calls = [];
  const video = { videoWidth: 1280, videoHeight: 720 };
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: (...args) => calls.push(args) }),
    toBlob: callback => callback(new Blob(["photo"], { type: "image/jpeg" })) };
  const file = await captureVideoFrame(video, canvas, 1234);
  assert.equal(canvas.width, 1280); assert.equal(canvas.height, 720);
  assert.equal(calls.length, 1); assert.equal(file.name, "home-photo-1234.jpg"); assert.equal(file.type, "image/jpeg");
});

test("an unready camera or failed canvas encoding cannot create a photo", async () => {
  const canvas = { getContext: () => ({ drawImage() {} }), toBlob: callback => callback(null) };
  await assert.rejects(captureVideoFrame({ videoWidth: 0, videoHeight: 720 }, canvas), /not ready/i);
  await assert.rejects(captureVideoFrame({ videoWidth: 10, videoHeight: 10 }, canvas), /capture/i);
});

test("closing the camera stops every media track", () => {
  const stopped = [];
  stopMediaStream({ getTracks: () => [{ stop: () => stopped.push(1) }, { stop: () => stopped.push(2) }] });
  assert.deepEqual(stopped, [1, 2]);
});
