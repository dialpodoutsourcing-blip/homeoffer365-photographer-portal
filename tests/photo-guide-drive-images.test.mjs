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

test("photo guide cards and galleries use the coherent Pennsylvania property set", () => {
  assert.equal(photoCategories.length, 4);

  for (const category of photoCategories) {
    assert.match(category.image, /^\/images\/photo-examples\/pennsylvania-brick-bungalow\//);
    assert.ok(existsSync(new URL(`public${category.image}`, repoRoot)), `missing card image ${category.image}`);
    assert.doesNotMatch(category.alt, /AI-generated/i);

    const examples = galleries[category.id];
    assert.ok(examples.length >= 2, `${category.id} needs multiple examples`);
    for (const example of examples) {
      assert.match(example.src, /^\/images\/photo-examples\/pennsylvania-brick-bungalow\//);
      assert.ok(existsSync(new URL(`public${example.src}`, repoRoot)), `missing example image ${example.src}`);
      assert.doesNotMatch(`${example.alt} ${example.note}`, /AI-generated/i);
    }
  }

  assert.equal(mechanicalExamples.length, 11);
  assert.deepEqual(mechanicalExamples.map(({ label }) => label), [
    "Furnace and ductwork",
    "Exterior electrical meter",
    "Electrical service context",
    "Under-sink plumbing",
    "Basement utility overview",
    "Modern furnace",
    "Water heater",
    "Water softener",
    "Well pump system",
    "Exterior AC condenser",
    "Breaker panel",
  ]);
  assert.equal(exteriorExamples[2].label, "Front and side angle");
  assert.doesNotMatch(`${interiorExamples[2].alt} ${conditionExamples[1].alt}`, /empty|ceiling fan|closet doors/i);
});

test("photographer welcome hero uses the Pennsylvania exterior", () => {
  const styles = readFileSync(new URL("app/globals.css", repoRoot), "utf8");
  const welcome = readFileSync(new URL("components/photographer-guide/welcome.tsx", repoRoot), "utf8");

  assert.match(styles, /hero-visual[^}]+pennsylvania-brick-bungalow\/exterior-front\.png/s);
  assert.doesNotMatch(styles, /hero-visual[^}]+photo-examples\/exterior\.jpg/s);
  assert.doesNotMatch(welcome, /AI-generated exterior/i);
});
