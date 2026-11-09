import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import {
  conditionExamples,
  exteriorExamples,
  interiorExamples,
  mechanicalExamples,
  photoCategories,
} from "../content/photographer-guide.ts";

const repoRoot = new URL("../", import.meta.url);
const galleries = { exterior: exteriorExamples, interior: interiorExamples, mechanical: mechanicalExamples, condition: conditionExamples };

test("photo guide cards and example galleries use local photos from the supplied Drive set", () => {
  assert.equal(photoCategories.length, 4);

  for (const category of photoCategories) {
    assert.match(category.image, /^\/images\/photo-examples\/equity-drive\//);
    assert.ok(existsSync(new URL(`public${category.image}`, repoRoot)), `missing card image ${category.image}`);
    assert.doesNotMatch(category.alt, /AI-generated/i);

    const examples = galleries[category.id];
    assert.ok(examples.length >= 2, `${category.id} needs multiple examples`);
    for (const example of examples) {
      assert.match(example.src, /^\/images\/photo-examples\/equity-drive\//);
      assert.ok(existsSync(new URL(`public${example.src}`, repoRoot)), `missing example image ${example.src}`);
      assert.doesNotMatch(`${example.alt} ${example.note}`, /AI-generated/i);
    }
  }
});

test("photographer welcome hero uses the selected Drive exterior", () => {
  const styles = readFileSync(new URL("app/globals.css", repoRoot), "utf8");
  const welcome = readFileSync(new URL("components/photographer-guide/welcome.tsx", repoRoot), "utf8");

  assert.match(styles, /hero-visual[^}]+equity-drive\/1\.jpg/s);
  assert.doesNotMatch(styles, /hero-visual[^}]+photo-examples\/exterior\.jpg/s);
  assert.doesNotMatch(welcome, /AI-generated exterior/i);
});
