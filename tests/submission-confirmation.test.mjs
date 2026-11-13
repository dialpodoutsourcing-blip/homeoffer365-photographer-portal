import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const confirmationPath = new URL("../components/photographer-guide/submission-confirmation.tsx", import.meta.url);
const formPath = new URL("../components/photographer-guide/submission-form.tsx", import.meta.url);
const stylesPath = new URL("../app/globals.css", import.meta.url);

async function readOrEmpty(path) {
  return readFile(path, "utf8").catch(() => "");
}

test("a successful submission opens an accessible confirmation dialog that can reset the form", async () => {
  const [confirmation, form] = await Promise.all([
    readOrEmpty(confirmationPath),
    readOrEmpty(formPath),
  ]);

  assert.match(confirmation, /role="dialog"/);
  assert.match(confirmation, /aria-modal="true"/);
  assert.match(confirmation, /Photos &amp; Videos[\s\S]*Successfully Submitted!/);
  assert.match(confirmation, /aria-label="Close confirmation"/);
  assert.match(confirmation, /event\.key === "Escape"/);
  assert.match(confirmation, /event\.key === "Tab"/);
  assert.match(confirmation, /backgroundElement\.inert = true/);
  assert.match(confirmation, /createPortal\(/);
  assert.match(confirmation, /document\.body\.style\.overflow = "hidden"/);
  assert.match(confirmation, /document\.body\.style\.overflow = previousOverflow/);
  assert.match(form, /photographerName/);
  assert.match(form, /\.focus\(\)/);
  assert.match(form, /<SubmissionConfirmation onClose=\{closeConfirmation\} \/>/);
});

test("the confirmation contains the approved Ashley, next-step content, and official footer logo", async () => {
  const confirmation = await readOrEmpty(confirmationPath);

  assert.match(confirmation, /\/images\/team\/ashley-sellers\.jpg/);
  assert.match(confirmation, /Thank You!/);
  assert.match(confirmation, /payment will be processed promptly/);
  assert.match(confirmation, /Home Offer 365 Team/);
  assert.match(confirmation, /\/images\/brand\/home-offer-365-logo\.png/);
  assert.match(confirmation, /alt="Home Offer 365"/);
  assert.doesNotMatch(confirmation, /submission-confirmation-house-mark|\bHouse\b/);
});

test("the appreciation stays on two lines and next-step icons align to the top", async () => {
  const [confirmation, styles] = await Promise.all([readOrEmpty(confirmationPath), readOrEmpty(stylesPath)]);

  assert.match(confirmation, /submission-appreciation-line">Thank you for your time, effort, and professional<\/span>/);
  assert.match(confirmation, /submission-appreciation-line">photography services\. We truly appreciate your work\.<\/span>/);
  assert.equal((confirmation.match(/submission-appreciation-line/g) ?? []).length, 2);
  assert.match(styles, /\.submission-appreciation-line\s*\{[^}]*display:\s*block[^}]*white-space:\s*nowrap/s);
  assert.match(styles, /\.submission-next-steps\s*>\s*div\s*\{[^}]*align-items:\s*start/s);
  assert.match(styles, /\.submission-next-steps svg\s*\{[^}]*margin-top:/s);
  assert.match(styles, /\.submission-confirmation-brand-logo\s*\{/);
});

test("the confirmation styling stays viewport-bound and respects reduced motion", async () => {
  const styles = await readOrEmpty(stylesPath);

  assert.match(styles, /\.submission-confirmation-overlay\s*\{[^}]*position:\s*fixed[^}]*inset:\s*0[^}]*overflow:\s*hidden/s);
  assert.match(styles, /height:\s*100dvh/);
  assert.match(styles, /@media\s*\(max-height:\s*720px\)/);
  assert.match(styles, /@media\s*\(max-height:\s*520px\)/);
  assert.match(styles, /height:\s*calc\(100%\s*\/\s*\.82\)/);
  assert.match(styles, /transform:\s*scale\(\.82\)/);
  assert.match(styles, /@keyframes\s+submission-check-draw/);
  assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
