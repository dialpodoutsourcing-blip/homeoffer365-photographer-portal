import assert from "node:assert/strict";
import test from "node:test";

import {
  PHOTO_CATEGORIES,
  NEW_PHOTO_CATEGORIES,
  PHOTO_TYPES,
  OPTIONAL_FEATURES,
  PHOTO_MINIMUMS,
  getPhotoTypeOptions,
  validateDraftPhoto,
  countPhotosByCategory,
  validatePhotoMinimums,
  validateSubmissionManifest,
  createAutomaticDraftPhoto,
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
      photo({ clientPhotoId: "b1", category: "basement", photoType: "basement" }),
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
  assert.deepEqual(NEW_PHOTO_CATEGORIES, ["exterior", "interior", "mechanical", "basement", "other"]);
  assert.deepEqual(PHOTO_CATEGORIES, NEW_PHOTO_CATEGORIES);
  const expected = {
    exterior: ["front", "front_and_driveway", "side_yard", "front_and_side_angle", "property_boundary_and_fence", "rear", "exterior_ac_condenser", "exterior_electrical_service", "front_left_curb_view", "right_side_elevation", "backyard_and_rear_elevation", "roof_soffit_and_gutters", "other"],
    interior: ["living_room", "dining_area", "hallway_room_layout", "kitchen", "kitchen_under_sink_plumbing", "primary_bedroom", "second_bedroom", "bathroom", "bathroom_vanity_plumbing", "laundry_room", "entry_foyer", "living_room_reverse_view", "dining_room_reverse_view", "kitchen_wide_view", "kitchen_appliance_wall", "kitchen_cabinets_and_counters", "primary_bedroom_reverse_view", "primary_bedroom_closet", "second_bedroom_reverse_view", "bathroom_tub_and_shower", "hallway_linen_storage", "mudroom_and_back_entry", "basement_stair_access", "laundry_reverse_view", "basement", "basement_overview", "basement_stair_landing", "foundation_walls", "floor_drain_condition", "basement_window_and_egress", "basement_storage_area", "support_beam_and_columns", "basement_exterior_exit", "attic", "garage", "other"],
    mechanical: ["furnace_and_ductwork", "modern_furnace", "water_heater", "water_softener", "well_pump_system", "breaker_panel", "main_water_shutoff", "sump_pump", "hvac_service_connections", "plumbing_distribution", "other"],
    basement: ["basement"],
    condition: ["general_condition", "damage", "repair_needed", "other"],
    other: ["other"],
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
  for (const legacy of [
    { category: "exterior", photoType: "sides" }, { category: "exterior", photoType: "outbuildings" },
    { category: "interior", photoType: "bedroom" }, { category: "interior", photoType: "under_sink" },
    { category: "mechanical", photoType: "hvac" }, { category: "mechanical", photoType: "electrical_panel" },
  ]) assert.equal(validateDraftPhoto(photo(legacy)).ok, true, `legacy ${legacy.category}:${legacy.photoType}`);
});

test("automatic homeowner photos need no naming or classification input", () => {
  const image = { blob: new Blob(["image"], { type: "image/webp" }), width: 1200, height: 900, mimeType: "image/webp", byteSize: 5 };
  const result = createAutomaticDraftPhoto(image, "basement", 2, undefined, "2026-11-13T10:00:00.000Z");
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { ...image, clientPhotoId: result.value.clientPhotoId, photoName: "Basement photo 2", category: "basement", photoType: "basement", conditionStatus: "good_condition", description: "", capturedAt: "2026-11-13T10:00:00.000Z" });
  assert.match(result.value.clientPhotoId, /^[0-9a-f-]{36}$/i);
  const legacy = photo({ category: "condition", photoType: "general_condition" });
  assert.equal(validateDraftPhoto(legacy).ok, true);
  const retake = createAutomaticDraftPhoto(image, "exterior", 9, legacy, "2026-11-13T11:00:00.000Z");
  assert.equal(retake.ok, true);
  assert.equal(retake.value.clientPhotoId, legacy.clientPhotoId);
  assert.equal(retake.value.category, "condition");
});

test("draft validation normalizes text, preserves blobs, and accepts every inspector condition status", () => {
  const input = photo();
  const result = validateDraftPhoto(input);
  assert.equal(result.ok, true);
  assert.equal(result.value.photoName, "Front elevation");
  assert.equal(result.value.description, "Clear view");
  assert.equal(result.value.blob, input.blob);
  for (const conditionStatus of ["good_condition", "satisfactory", "needs_maintenance", "damage", "non_functional", "not_accessible"]) {
    assert.equal(validateDraftPhoto(photo({ conditionStatus })).ok, true, conditionStatus);
  }
  assert.equal(validateDraftPhoto(photo({ width: 800, height: 1200 })).ok, true);
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
    { conditionStatus: "excellent" },
    { conditionStatus: "poor" },
    { conditionStatus: 5 },
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
  assert.deepEqual(PHOTO_MINIMUMS, { exterior: 4, interior: 4, mechanical: 1, basement: 1, other: 0, condition: 0 });
  assert.deepEqual(countPhotosByCategory([]), { exterior: 0, interior: 0, mechanical: 0, basement: 0, other: 0, condition: 0 });
  const photos = manifest().photos;
  assert.deepEqual(countPhotosByCategory(photos), { exterior: 4, interior: 4, mechanical: 1, basement: 1, other: 0, condition: 0 });
  assert.equal(validatePhotoMinimums(photos).ok, true);
  for (const clientPhotoId of ["e1", "i1", "m1", "b1"]) {
    rejects(validatePhotoMinimums(photos.filter((item) => item.clientPhotoId !== clientPhotoId)));
  }
});

test("N/A accepts only the approved feature/category pairs without lowering minimums", () => {
  assert.deepEqual(OPTIONAL_FEATURES, {
    exterior: [], interior: ["basement", "attic", "garage"],
    mechanical: [], basement: [], condition: [], other: [],
  });
  const notApplicable = [
    { category: "interior", photoType: "basement" },
    { category: "interior", photoType: "attic" },
    { category: "interior", photoType: "garage" },
  ];
  assert.equal(validateSubmissionManifest(manifest({ notApplicable })).ok, true);
  rejects(validateSubmissionManifest(manifest({ photos: manifest().photos.slice(1), notApplicable })));
  for (const pair of [
    { category: "exterior", photoType: "roof" },
    { category: "exterior", photoType: "outbuildings" },
    { category: "exterior", photoType: "basement" },
    { category: "interior", photoType: "outbuildings" },
    { category: "interior", photoType: "kitchen" },
    { category: "mechanical", photoType: "hvac" },
    { category: "condition", photoType: "damage" },
    { category: "toString", photoType: "roof" },
  ]) rejects(validateSubmissionManifest(manifest({ notApplicable: [pair] })));
  rejects(validateSubmissionManifest(manifest({ notApplicable: [notApplicable[0], notApplicable[0]] })));
});

test("Other accepts only its own type and never replaces required photos or permits N/A", () => {
  const other = photo({ clientPhotoId: "other-1", category: "other", photoType: "other" });
  assert.equal(validateDraftPhoto(other).ok, true);
  for (const photoType of ["front", "kitchen", "hvac", "general_condition", "", "Other"]) {
    rejects(validateDraftPhoto({ ...other, photoType }));
  }
  const photos = [...manifest().photos, other];
  assert.deepEqual(countPhotosByCategory(photos), { exterior: 4, interior: 4, mechanical: 1, basement: 1, other: 1, condition: 0 });
  assert.equal(validateSubmissionManifest(manifest({ photos })).ok, true);
  rejects(validatePhotoMinimums(photos.filter(item => item.clientPhotoId !== "e1")));
  rejects(validateSubmissionManifest(manifest({ notApplicable: [{ category: "other", photoType: "other" }] })));
  rejects(validateDraftPhoto(photo({ category: "" })));
});

test("submission normalizes homeowner contact and address without payment data", () => {
  const input = manifest();
  const result = validateSubmissionManifest(input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.photographer, {
    name: "Ada Lovelace", email: "ada@example.com", phone: "(555) 123-4567",
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

test("submission enforces the email limit after Unicode lowercasing", () => {
  const email = `${"\u0130".repeat(308)}@example.com`;
  assert.equal(email.length, 320);
  rejects(validateSubmissionManifest(manifest({ photographer: { ...manifest().photographer, email } })));

  const boundary = `${"\u0130".repeat(154)}@example.com`;
  const result = validateSubmissionManifest(manifest({ photographer: { ...manifest().photographer, email: boundary } }));
  assert.equal(result.ok, true);
  assert.equal(result.value.photographer.email, `${"i\u0307".repeat(154)}@example.com`);
  assert.equal(result.value.photographer.email.length, 320);
});

test("submission rejects malformed homeowner email", () => {
  for (const email of ["ada", "ada@example", "a b@example.com", "a@@example.com"]) {
    rejects(validateSubmissionManifest(manifest({ photographer: { ...manifest().photographer, email } })));
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
