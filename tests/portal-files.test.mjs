import { test } from "node:test";
import assert from "node:assert/strict";
import { validateFile, maxFileBytes } from "../lib/portal/types.ts";

test("upload validation accepts supported media in the correct category", () => {
  assert.equal(validateFile({ type: "image/jpeg", size: 1000 }, "exterior"), null);
  assert.equal(validateFile({ type: "video/mp4", size: maxFileBytes }, "walkthrough"), null);
});
test("upload validation rejects empty, oversized, unsupported and mismatched files", () => {
  for (const size of [0, maxFileBytes + 1]) assert.ok(validateFile({ type: "image/jpeg", size }, "exterior"));
  assert.ok(validateFile({ type: "application/pdf", size: 1000 }, "interior"));
  assert.ok(validateFile({ type: "video/mp4", size: 1000 }, "mechanical"));
  assert.ok(validateFile({ type: "image/png", size: 1000 }, "walkthrough"));
});
