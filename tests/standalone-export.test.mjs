import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const artifact = new URL("../standalone/index.html", import.meta.url);

test("standalone photographers page embeds its runtime and media for offline sharing", async () => {
  const [html, info] = await Promise.all([readFile(artifact, "utf8"), stat(artifact)]);

  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/);
  assert.match(html, /data:image\/png;base64,/);
  assert.match(html, /data:image\/jpeg;base64,/);
  assert.match(html, /data:video\/mp4;base64,/);
  assert.match(html, /@media \(max-width:\s*1024px\)/);
  assert.match(html, /@media \(max-width:\s*680px\)/);
  assert.match(html, /pointer:\s*coarse/);
  assert.match(html, /id="photo-lightbox"/);
  assert.match(html, /id="submission-form"/);
  assert.doesNotMatch(html, /(?:src|href)="\/(?:images|videos|_next)\//);
  assert.doesNotMatch(html, /localhost:3001|https?:\/\/.*\.(?:css|js)(?:[?"'])/);
  assert.ok(info.size > 100_000_000, `expected embedded media artifact, received ${info.size} bytes`);
});
