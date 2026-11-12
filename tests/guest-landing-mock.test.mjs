import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const componentPath = new URL("../components/portal/guest-landing.tsx", import.meta.url);

test("guest landing presents the mock property and Drive-link submission flow", async () => {
  const source = await readFile(componentPath, "utf8");

  assert.match(source, /01 · Select your property/);
  assert.match(source, /02 · Add your files/);
  assert.match(source, /03 · Review & submit/);
  assert.match(source, /<select name="property"/);
  assert.match(source, /name="driveLink"/);
  assert.match(source, /Paste your Drive link/);
  assert.match(source, /Submit link/);
  assert.doesNotMatch(source, /Open visit/);
  assert.doesNotMatch(source, /getSharedVisitPath/);
});
