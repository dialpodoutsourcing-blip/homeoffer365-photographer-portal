import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appFile = (name) => new URL(`../app/${name}`, import.meta.url);

test("the homepage exposes branded social previews and standard app icons", async () => {
  const [layout, openGraph, twitter, icon, appleIcon] = await Promise.all([
    readFile(appFile("layout.tsx"), "utf8"),
    readFile(appFile("opengraph-image.tsx"), "utf8"),
    readFile(appFile("twitter-image.tsx"), "utf8"),
    readFile(appFile("icon.tsx"), "utf8"),
    readFile(appFile("apple-icon.tsx"), "utf8"),
  ]);

  assert.match(layout, /metadataBase: new URL\("https:\/\/photographer\.homeoffer365\.com"\)/);
  assert.match(layout, /title: "Welcome to Home Offer 365 \| Photographer Demo 4"/);
  assert.match(layout, /openGraph:\s*\{/);
  assert.match(layout, /twitter:\s*\{[\s\S]*?card: "summary_large_image"/);

  assert.match(openGraph, /width: 1200/);
  assert.match(openGraph, /height: 630/);
  assert.match(openGraph, /contentType = "image\/png"/);
  assert.match(openGraph, /Welcome to Home Offer 365/);
  assert.match(openGraph, /pennsylvania-brick-bungalow\/exterior-front\.png/);
  assert.match(openGraph, /home-offer-365-logo\.png/);
  assert.doesNotMatch(openGraph, /linear-gradient/);
  assert.match(openGraph, /rgba\(10, 31, 47, 0\.9\)/);

  assert.match(twitter, /opengraph-image/);
  assert.match(icon, /width: 32/);
  assert.match(icon, /height: 32/);
  assert.match(icon, /contentType = "image\/png"/);
  assert.doesNotMatch(icon, /maxWidth:\s*"none"/);
  assert.match(appleIcon, /width: 180/);
  assert.match(appleIcon, /height: 180/);
  assert.match(appleIcon, /contentType = "image\/png"/);
  assert.doesNotMatch(appleIcon, /maxWidth:\s*"none"/);
});
