import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("the help footer shows the official clickable contact details", async () => {
  const source = await readFile(new URL("../components/layout/site-footer.tsx", import.meta.url), "utf8");

  assert.match(source, /href="tel:\+12407928488"/);
  assert.match(source, />\(240\) 792-8488</);
  assert.match(source, /href="mailto:info@homeoffer365\.com"/);
  assert.match(source, />info@homeoffer365\.com</);
  assert.match(source, /725 Walnut St Suite 5/);
  assert.match(source, /Lebanon, PA 17042/);
  assert.doesNotMatch(source, /Placeholder details|example\.com|555-0148/);
});
