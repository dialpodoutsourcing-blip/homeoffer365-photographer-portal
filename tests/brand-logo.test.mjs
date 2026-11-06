import { test } from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

test("the shared brand component uses the official Home Offer 365 logo image", async () => {
  const source = await readFile(new URL("../components/layout/brand-logo.tsx", import.meta.url), "utf8");

  assert.match(source, /home-offer-365-logo\.png/);
  assert.match(source, /alt="Home Offer 365"/);
  assert.doesNotMatch(source, /brand-wordmark/);
  await access(new URL("../public/images/brand/home-offer-365-logo.png", import.meta.url));
});
