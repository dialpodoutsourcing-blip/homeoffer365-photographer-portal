import assert from "node:assert/strict";
import test from "node:test";

import {
  PHOTO_CATEGORIES,
  PHOTO_TYPES,
  OPTIONAL_FEATURES,
  PHOTO_MINIMUMS,
  getPhotoTypeOptions,
  validateDraftPhoto,
  countPhotosByCategory,
  validatePhotoMinimums,
  validateSubmissionManifest,
} from "../lib/demo-five/photo-workflow.ts";

function photo(overrides = {}) {
  return {
    clientPhotoId: "photo-1",
    blob: new Blob(["image"], { type: "image/webp" }),
    photoName: "  Front elevation  ",
    category: "exterior",
    photoType: "front",
    conditionStatus: "good_condition",
    description: "  Clear view  ",
    capturedAt: "2026-11-13T10:00:00.000Z",
    width: 2400,
    height: 1600,
    mimeType: "image/webp",
    byteSize: 5,
    ...overrides,
  };
}

function manifest(overrides = {}) {
  return {
    photographer: {
      name: "  Ada Lovelace  ",
      email: "  ADA@EXAMPLE.COM  ",
      phone: "  (555) 123-4567  ",
      paymentMethod: "  Invoice  ",
      paymentUrl: "  https://payments.example.com/ada  ",
    },
    propertyAddress: "  123 Main Street, Philadelphia, PA 19103  ",
    photos: [
      photo({ clientPhotoId: "e1" }),
      photo({ clientPhotoId: "e2", photoType: "rear" }),
      photo({ clientPhotoId: "e3", photoType: "sides" }),
      photo({ clientPhotoId: "e4", photoType: "front" }),
      photo({ clientPhotoId: "i1", category: "interior", photoType: "living_room" }),
      photo({ clientPhotoId: "i2", category: "interior", photoType: "kitchen" }),
      photo({ clientPhotoId: "i3", category: "interior", photoType: "bedroom" }),
      photo({ clientPhotoId: "i4", category: "interior", photoType: "bathroom" }),
      photo({ clientPhotoId: "m1", category: "mechanical", photoType: "hvac" }),
      photo({ clientPhotoId: "c1", category: "condition", photoType: "general_condition" }),
    ],
    notApplicable: [],
    ...overrides,
  };
}

function rejects(result) {
  assert.equal(result.ok, false);
  assert.equal(typeof result.error, "string");
  assert.ok(result.error.length > 0);
}

test("category choices expose the approved stable photo-type values", () => {
  assert.deepEqual(PHOTO_CATEGORIES, ["exterior", "interior", "mechanical", "condition"]);
  const expected = {
    exterior: ["front", "rear", "sides", "roof", "yard", "driveway", "outbuildings", "damage", "other"],
    interior: ["living_room", "kitchen", "hallway_room_layout", "bedroom", "bathroom", "basement", "attic", "garage", "under_sink", "damage", "other"],
    mechanical: ["hvac", "water_heater", "electrical_panel", "plumbing", "other"],
    condition: ["general_condition", "damage", "repair_needed", "other"],
  };
  assert.deepEqual(PHOTO_TYPES, expected);
  for (const [category, options] of Object.entries(expected)) {
    assert.deepEqual(getPhotoTypeOptions(category), options);
    for (const photoType of options) {
      assert.equal(validateDraftPhoto(photo({ category, photoType })).ok, true);
    }
  }
  assert.deepEqual(getPhotoTypeOptions("spoofed"), []);
  assert.deepEqual(getPhotoTypeOptions("toString"), []);
});

test("draft validation normalizes text, preserves blobs, and accepts either condition status", () => {
  const input = photo();
  const result = validateDraftPhoto(input);
  assert.equal(result.ok, true);
  assert.equal(result.value.photoName, "Front elevation");
  assert.equal(result.value.description, "Clear view");
  assert.equal(result.value.blob, input.blob);
  assert.equal(validateDraftPhoto(photo({ conditionStatus: "damage" })).ok, true);
  assert.equal(validateDraftPhoto(photo({ description: undefined })).value.description, "");
  assert.equal(input.photoName, "  Front elevation  ");
});

test("draft validation rejects spoofed category/type/status combinations", () => {
  for (const invalid of [
    { category: "outside" },
    { category: "toString" },
    { photoType: "kitchen" },
    { photoType: "Front" },
    { category: "mechanical", photoType: "roof" },
    { category: "condition", photoType: "hvac" },
    { conditionStatus: "n/a" },
    { conditionStatus: "good" },
    { conditionStatus: "" },
  ]) rejects(validateDraftPhoto(photo(invalid)));
});

test("custom photo names and optional descriptions enforce exact text boundaries", () => {
  assert.equal(validateDraftPhoto(photo({ photoName: "a".repeat(255), description: "a".repeat(5000) })).ok, true);
  for (const invalid of [
    { photoName: " " }, { photoName: 5 }, { photoName: "a".repeat(256) },
    { description: "a".repeat(5001) }, { description: 5 },
  ]) rejects(validateDraftPhoto(photo(invalid)));
});

test("malformed IDs and prepared image metadata cannot become saved photos", () => {
  for (const invalid of [
    { clientPhotoId: " " }, { clientPhotoId: 1 }, { capturedAt: "yesterday" },
    { capturedAt: "2026-02-30T00:00:00.000Z" }, { capturedAt: "2026-11-13" },
    { width: 0 }, { width: 1.5 }, { height: -1 }, { height: Infinity },
    { byteSize: 0 }, { byteSize: 1.1 }, { byteSize: 10485761 },
    { mimeType: "image/svg+xml" }, { mimeType: "text/plain" },
    { blob: null }, { blob: {} }, { blob: new Blob([]) },
  ]) rejects(validateDraftPhoto(photo(invalid)));
  for (const malformed of [null, [], "photo", {}]) rejects(validateDraftPhoto(malformed));
  assert.equal(validateDraftPhoto(photo({ mimeType: "image/jpeg", byteSize: 10485760 })).ok, true);
});

test("JSON manifest validation accepts photo metadata without blobs and omits binary fields", () => {
  const input = manifest();
  const metadata = input.photos.map((item) => {
    const value = { ...item };
    delete value.blob;
    return value;
  });
  const result = validateSubmissionManifest({ ...input, photos: metadata });
  assert.equal(result.ok, true);
  assert.equal(Object.hasOwn(result.value.photos[0], "blob"), false);
  assert.equal(Object.hasOwn(validateSubmissionManifest(input).value.photos[0], "blob"), false);
});

test("minimums count actual photos and allow multiple photos of the same type", () => {
  assert.deepEqual(PHOTO_MINIMUMS, { exterior: 4, interior: 4, mechanical: 1, condition: 1 });
  assert.deepEqual(countPhotosByCategory([]), { exterior: 0, interior: 0, mechanical: 0, condition: 0 });
  const photos = manifest().photos;
  assert.deepEqual(countPhotosByCategory(photos), { exterior: 4, interior: 4, mechanical: 1, condition: 1 });
  assert.equal(validatePhotoMinimums(photos).ok, true);
  for (const clientPhotoId of ["e1", "i1", "m1", "c1"]) {
    rejects(validatePhotoMinimums(photos.filter((item) => item.clientPhotoId !== clientPhotoId)));
  }
});

test("N/A accepts only the approved feature/category pairs without lowering minimums", () => {
  assert.deepEqual(OPTIONAL_FEATURES, {
    exterior: ["roof", "outbuildings"], interior: ["basement", "attic", "garage"],
    mechanical: [], condition: [],
  });
  const notApplicable = [
    { category: "exterior", photoType: "roof" },
    { category: "exterior", photoType: "outbuildings" },
    { category: "interior", photoType: "basement" },
    { category: "interior", photoType: "attic" },
    { category: "interior", photoType: "garage" },
  ];
  assert.equal(validateSubmissionManifest(manifest({ notApplicable })).ok, true);
  rejects(validateSubmissionManifest(manifest({ photos: manifest().photos.slice(1), notApplicable })));
  for (const pair of [
    { category: "exterior", photoType: "basement" },
    { category: "interior", photoType: "outbuildings" },
    { category: "interior", photoType: "kitchen" },
    { category: "mechanical", photoType: "hvac" },
    { category: "condition", photoType: "damage" },
    { category: "toString", photoType: "roof" },
  ]) rejects(validateSubmissionManifest(manifest({ notApplicable: [pair] })));
  rejects(validateSubmissionManifest(manifest({ notApplicable: [notApplicable[0], notApplicable[0]] })));
});

test("submission normalizes contact/address fields and lowercases photographer email", () => {
  const input = manifest();
  const result = validateSubmissionManifest(input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.photographer, {
    name: "Ada Lovelace", email: "ada@example.com", phone: "(555) 123-4567",
    paymentMethod: "Invoice", paymentUrl: "https://payments.example.com/ada",
  });
  assert.equal(result.value.propertyAddress, "123 Main Street, Philadelphia, PA 19103");
  assert.equal(result.value.photos[0].photoName, "Front elevation");
  assert.equal(input.photographer.email, "  ADA@EXAMPLE.COM  ");
});

test("required contact/address fields enforce their exact maximum lengths", () => {
  const input = manifest();
  for (const [field, max, boundary] of [
    ["name", 200, "a".repeat(200)],
    ["email", 320, `${"a".repeat(308)}@example.com`],
    ["phone", 50, "1".repeat(50)],
    ["paymentMethod", 100, "a".repeat(100)],
    ["paymentUrl", 2048, `https://example.com/${"a".repeat(2028)}`],
  ]) {
    assert.equal(boundary.length, max);
    assert.equal(validateSubmissionManifest(manifest({ photographer: { ...input.photographer, [field]: boundary } })).ok, true, field);
    for (const value of [" ", null, 5, `${boundary}a`]) {
      rejects(validateSubmissionManifest(manifest({ photographer: { ...input.photographer, [field]: value } })));
    }
  }
  assert.equal(validateSubmissionManifest(manifest({ propertyAddress: "a".repeat(500) })).ok, true);
  for (const propertyAddress of [" ", null, "a".repeat(501)]) rejects(validateSubmissionManifest(manifest({ propertyAddress })));
});

test("submission rejects malformed email and non-HTTPS or credential-bearing payment URLs", () => {
  for (const email of ["ada", "ada@example", "a b@example.com", "a@@example.com"]) {
    rejects(validateSubmissionManifest(manifest({ photographer: { ...manifest().photographer, email } })));
  }
  for (const paymentUrl of ["http://example.com", "javascript:alert(1)", "https://", "https://user:secret@example.com", "/pay"]) {
    rejects(validateSubmissionManifest(manifest({ photographer: { ...manifest().photographer, paymentUrl } })));
  }
});

test("duplicate normalized client photo IDs and invalid nested photos reject the submission", () => {
  const photos = manifest().photos;
  rejects(validateSubmissionManifest(manifest({ photos: [...photos, photo({ clientPhotoId: " e1 " })] })));
  rejects(validateSubmissionManifest(manifest({ photos: [...photos, photo({ clientPhotoId: "bad", photoType: "kitchen" })] })));
});

test("submission rejects malformed collections and enforces total count/byte bounds", () => {
  for (const invalid of [null, [], {}, { ...manifest(), photographer: [] }, { ...manifest(), photos: {} }, { ...manifest(), notApplicable: {} }]) {
    rejects(validateSubmissionManifest(invalid));
  }
  const photos = manifest().photos;
  const hundred = [...photos, ...Array.from({ length: 90 }, (_, index) => photo({ clientPhotoId: `extra-${index}` }))];
  assert.equal(validateSubmissionManifest(manifest({ photos: hundred })).ok, true);
  rejects(validateSubmissionManifest(manifest({ photos: [...hundred, photo({ clientPhotoId: "101" })] })));
  const fifty = [...photos, ...Array.from({ length: 40 }, (_, index) => photo({ clientPhotoId: `extra-${index}` }))]
    .map((item) => ({ ...item, byteSize: 10485760 }));
  assert.equal(validateSubmissionManifest(manifest({ photos: fifty })).ok, true);
  rejects(validateSubmissionManifest(manifest({ photos: [...fifty, photo({ clientPhotoId: "over-total" })] })));
});
