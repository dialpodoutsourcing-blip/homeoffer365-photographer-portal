import assert from "node:assert/strict";
import test from "node:test";

import {
  createSubmission,
  validateSubmission,
} from "../lib/submissions/create-submission.ts";

const validInput = {
  photographerName: "  Ada Lovelace  ",
  email: "  ADA@example.com ",
  phone: "  (555) 123-4567 ",
  propertyAddress: "  123 Main Street, Philadelphia, PA 19103 ",
  driveLink: " https://drive.google.com/drive/folders/example ",
  checklistComplete: true,
};

test("validateSubmission trims a complete submission", () => {
  assert.deepEqual(validateSubmission(validInput), {
    photographerName: "Ada Lovelace",
    email: "ADA@example.com",
    phone: "(555) 123-4567",
    propertyAddress: "123 Main Street, Philadelphia, PA 19103",
    driveLink: "https://drive.google.com/drive/folders/example",
    checklistComplete: true,
  });
});

test("validateSubmission rejects missing, oversized, and malformed fields", () => {
  assert.equal(validateSubmission({ ...validInput, email: "" }), null);
  assert.equal(validateSubmission({ ...validInput, photographerName: "x".repeat(201) }), null);
  assert.equal(validateSubmission({ ...validInput, driveLink: "http://drive.google.com/folder" }), null);
  assert.equal(validateSubmission({ ...validInput, driveLink: "https://example.com/folder" }), null);
  assert.equal(validateSubmission({ ...validInput, driveLink: "https://user:pass@drive.google.com/folder" }), null);
  assert.equal(validateSubmission({ ...validInput, checklistComplete: "true" }), null);
  assert.equal(validateSubmission(null), null);
});

test("createSubmission passes normalized data to the persistence boundary", async () => {
  let inserted;
  const result = await createSubmission(validInput, async (submission) => {
    inserted = submission;
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(inserted.photographerName, "Ada Lovelace");
  assert.equal(inserted.email, "ADA@example.com");
});

test("createSubmission distinguishes invalid input from persistence failure", async () => {
  assert.deepEqual(await createSubmission({}, async () => {}), {
    ok: false,
    reason: "invalid",
  });
  assert.deepEqual(
    await createSubmission(validInput, async () => {
      throw new Error("database detail must stay private");
    }),
    { ok: false, reason: "persistence" },
  );
});
