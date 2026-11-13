import assert from "node:assert/strict";
import test from "node:test";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";

import {
  createIndexedDbPhotoDraftStore,
  createPhotoDraftKey,
  PhotoDraftCorruptionError,
} from "../lib/demo-five/photo-draft-store.ts";
import { preparePhoto } from "../lib/demo-five/prepare-photo.ts";

const DB_NAME = "homeoffer365-demo-five";
const STORE_NAME = "photo-drafts";
const MiB = 1024 * 1024;

function draft(overrides = {}) {
  const propertyAddress = "123 Main Street";
  const browserDraftId = "browser-draft-1";
  return {
    version: 1,
    draftKey: createPhotoDraftKey(propertyAddress, browserDraftId),
    browserDraftId,
    propertyAddress,
    photographer: { name: "Ada", email: "", phone: "", paymentMethod: "", paymentUrl: "" },
    notApplicable: [{ category: "interior", photoType: "basement" }],
    updatedAt: "2026-11-13T12:00:00.000Z",
    photos: [{
      clientPhotoId: "photo-1", photoName: "Front view", category: "exterior",
      photoType: "front", conditionStatus: "good_condition", description: "",
      capturedAt: "2026-11-13T11:00:00.000Z", width: 2400, height: 1600,
      mimeType: "image/webp", byteSize: 5, blob: new Blob(["image"], { type: "image/webp" }),
    }],
    ...overrides,
  };
}

function openRaw(factory, version = 1, upgrade) {
  return new Promise((resolve, reject) => {
    const request = factory.open(DB_NAME, version);
    request.onupgradeneeded = () => upgrade?.(request.result);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function rawRecord(factory, key, value) {
  const db = await openRaw(factory);
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, value === undefined ? "readonly" : "readwrite");
      const request = value === undefined ? tx.objectStore(STORE_NAME).get(key) : tx.objectStore(STORE_NAME).put(value);
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

test("draft keys normalize address casing/whitespace and isolate stable browser IDs without collisions", () => {
  assert.equal(createPhotoDraftKey("  123  MAIN\n Street ", "browser-1"), createPhotoDraftKey("123 main street", "browser-1"));
  assert.notEqual(createPhotoDraftKey("123 Main Street", "browser-1"), createPhotoDraftKey("123 Main Street", "browser-2"));
  assert.notEqual(createPhotoDraftKey("123 Main Street", "browser-1"), createPhotoDraftKey("125 Main Street", "browser-1"));
  assert.notEqual(createPhotoDraftKey("a:b", "c"), createPhotoDraftKey("a", "b:c"));
  assert.throws(() => createPhotoDraftKey("123 Main Street", " "));
});

test("new databases upgrade to v1 and round-trip metadata, N/A, unfinished fields, and blob bytes", async () => {
  const factory = new IDBFactory();
  const store = createIndexedDbPhotoDraftStore(factory);
  const input = draft();
  await store.save(input);
  const restored = await createIndexedDbPhotoDraftStore(factory).load(input.draftKey);
  assert.deepEqual(restored, input);
  assert.equal(await restored.photos[0].blob.text(), "image");
  assert.notEqual(restored.photos[0].blob, input.photos[0].blob);
  const db = await openRaw(factory);
  assert.equal(db.version, 1);
  assert.deepEqual([...db.objectStoreNames], [STORE_NAME]);
  db.close();
});

test("saving the same key atomically replaces it while list/delete preserve other addresses", async () => {
  const store = createIndexedDbPhotoDraftStore(new IDBFactory());
  const first = draft();
  const second = draft({ propertyAddress: "125 Main Street", draftKey: createPhotoDraftKey("125 Main Street", first.browserDraftId), photos: [] });
  await store.save(first);
  await store.save(second);
  const changed = { ...first, photographer: { ...first.photographer, name: "Grace" }, photos: [] };
  await store.save(changed);
  assert.deepEqual(await store.load(first.draftKey), changed);
  assert.deepEqual((await store.list()).drafts.map((item) => item.draftKey).sort(), [first.draftKey, second.draftKey].sort());
  await store.delete(first.draftKey);
  await store.delete("missing");
  assert.equal(await store.load(first.draftKey), null);
  assert.deepEqual(await store.list(), { drafts: [second], unreadableDraftKeys: [] });
});

test("independent restored copies cannot overwrite newer edits or recreate a deleted draft", async () => {
  const factory = new IDBFactory(), first = createIndexedDbPhotoDraftStore(factory), second = createIndexedDbPhotoDraftStore(factory);
  const original = draft(); await first.save(original);
  const left = await first.load(original.draftKey), right = await second.load(original.draftKey);
  left.photos[0].photoName = "Newer front view";
  right.photographer.name = "Stale edit";
  await first.save(left);
  await assert.rejects(second.save(right), { name: "PhotoDraftConflictError" });
  assert.equal((await second.load(original.draftKey)).photos[0].photoName, "Newer front view");
  await first.delete(original.draftKey);
  await assert.rejects(second.save(left), { name: "PhotoDraftConflictError" });
  assert.equal(await first.load(original.draftKey), null);
});

test("address migration checks the prior revision and moves the record atomically", async () => {
  const factory = new IDBFactory(), store = createIndexedDbPhotoDraftStore(factory), other = createIndexedDbPhotoDraftStore(factory);
  const original = draft(); await store.save(original);
  const stale = await other.load(original.draftKey);
  const moved = { ...original, propertyAddress: "456 New Street", draftKey: createPhotoDraftKey("456 New Street", original.browserDraftId) };
  await store.save(moved, original.draftKey);
  assert.equal(await store.load(original.draftKey), null);
  assert.equal((await store.load(moved.draftKey)).photos.length, 1);
  await assert.rejects(other.save({ ...stale, propertyAddress: "789 Stale Street", draftKey: createPhotoDraftKey("789 Stale Street", stale.browserDraftId) }, original.draftKey), { name: "PhotoDraftConflictError" });
  assert.equal((await store.list()).drafts.length, 1);
});

test("save snapshots the draft before asynchronous storage opens so later form edits cannot change the saved photo", async () => {
  const store = createIndexedDbPhotoDraftStore(new IDBFactory());
  const input = draft();
  const saving = store.save(input);
  input.photographer.name = "Edited while saving";
  input.photos[0].photoName = "Edited photo";
  input.photos.length = 0;
  await saving;
  const restored = await store.load(input.draftKey);
  assert.equal(restored.photographer.name, "Ada");
  assert.equal(restored.photos.length, 1);
  assert.equal(restored.photos[0].photoName, "Front view");
});

test("existing v1 data is preserved and missing records return null", async () => {
  const factory = new IDBFactory();
  const db = await openRaw(factory, 1, (database) => database.createObjectStore(STORE_NAME, { keyPath: "draftKey" }));
  db.close();
  const input = draft();
  await rawRecord(factory, input.draftKey, input);
  const store = createIndexedDbPhotoDraftStore(factory);
  assert.deepEqual(await store.load(input.draftKey), { ...input, revision: 0 });
  assert.equal(await store.load("missing"), null);
});

test("legacy records without revisions cannot be recreated by a stale restored copy after deletion", async () => {
  const factory = new IDBFactory(), store = createIndexedDbPhotoDraftStore(factory);
  await store.list();
  const legacy = draft(); await rawRecord(factory, legacy.draftKey, legacy);
  const stale = await store.load(legacy.draftKey);
  await store.delete(legacy.draftKey);
  await assert.rejects(store.save(stale), { name: "PhotoDraftConflictError" });
  assert.equal(await store.load(legacy.draftKey), null);
});

test("an unsupported database version rejects without resetting stored data", async () => {
  const factory = new IDBFactory();
  const db = await openRaw(factory, 2, (database) => database.createObjectStore(STORE_NAME, { keyPath: "draftKey" }));
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(draft());
  await new Promise((resolve) => { tx.oncomplete = resolve; });
  db.close();
  await assert.rejects(createIndexedDbPhotoDraftStore(factory).list(), { name: "VersionError" });
  const newer = await openRaw(factory, 2);
  const request = newer.transaction(STORE_NAME).objectStore(STORE_NAME).get(draft().draftKey);
  const value = await new Promise((resolve) => { request.onsuccess = () => resolve(request.result); });
  assert.equal(value.photos.length, 1);
  newer.close();
});

test("listing a corrupt draft preserves it and still offers healthy drafts for restoration", async () => {
  const factory = new IDBFactory();
  const store = createIndexedDbPhotoDraftStore(factory);
  await store.list();
  const malformed = draft({ photos: [{ clientPhotoId: "broken", blob: new Blob([]) }] });
  await rawRecord(factory, malformed.draftKey, malformed);
  const healthy = draft({ browserDraftId: "healthy", draftKey: createPhotoDraftKey("123 Main Street", "healthy") });
  await store.save(healthy);
  await assert.rejects(store.load(malformed.draftKey), PhotoDraftCorruptionError);
  const listed = await store.list();
  assert.deepEqual(listed.drafts, [healthy]);
  assert.deepEqual(listed.unreadableDraftKeys, [malformed.draftKey]);
  assert.deepEqual(await rawRecord(factory, malformed.draftKey), malformed);
});

test("save rejects corrupt metadata, mismatched blobs, duplicate IDs, and invalid N/A without overwriting a good draft", async () => {
  const factory = new IDBFactory();
  const store = createIndexedDbPhotoDraftStore(factory);
  const valid = draft();
  await store.save(valid);
  for (const invalid of [
    { version: 2 }, { draftKey: "wrong-address" }, { browserDraftId: "" },
    { photographer: null }, { photographer: { ...valid.photographer, name: 3 } },
    { updatedAt: "yesterday" }, { photos: null },
    { photos: [{ ...valid.photos[0], byteSize: 7 }] },
    { photos: [{ ...valid.photos[0], blob: new Blob(["image"], { type: "image/jpeg" }) }] },
    { photos: [{ ...valid.photos[0], photoType: "kitchen" }] },
    { photos: [valid.photos[0], valid.photos[0]] },
    { notApplicable: [{ category: "exterior", photoType: "kitchen" }] },
    { notApplicable: [valid.notApplicable[0], valid.notApplicable[0]] },
  ]) {
    await assert.rejects(store.save({ ...valid, ...invalid }), PhotoDraftCorruptionError);
    assert.deepEqual(await store.load(valid.draftKey), valid);
  }
});

test("quota failure after a put aborts atomically, propagates the quota error, and retains the previous blob", async (t) => {
  const store = createIndexedDbPhotoDraftStore(new IDBFactory());
  const valid = draft();
  await store.save(valid);
  const originalPut = IDBObjectStore.prototype.put;
  const quota = new DOMException("Storage full", "QuotaExceededError");
  IDBObjectStore.prototype.put = function (...args) {
    const request = originalPut.apply(this, args);
    request.addEventListener("success", () => {
      Object.defineProperty(this.transaction, "error", { value: quota });
      this.transaction.abort();
    });
    return request;
  };
  t.after(() => { IDBObjectStore.prototype.put = originalPut; });
  await assert.rejects(store.save({ ...valid, photos: [] }), (error) => error === quota);
  assert.deepEqual(await store.load(valid.draftKey), valid);
});

test("synchronous quota errors and unavailable storage surface without replacing prior data", async (t) => {
  const factory = new IDBFactory();
  const store = createIndexedDbPhotoDraftStore(factory);
  const valid = draft();
  await store.save(valid);
  const originalPut = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = () => { throw new DOMException("Storage full", "QuotaExceededError"); };
  t.after(() => { IDBObjectStore.prototype.put = originalPut; });
  await assert.rejects(store.save({ ...valid, photos: [] }), { name: "QuotaExceededError" });
  assert.deepEqual(await store.load(valid.draftKey), valid);
  await assert.rejects(createIndexedDbPhotoDraftStore(undefined).list(), /unavailable/i);
});

function imageTools({ width = 4000, height = 3000, encode } = {}) {
  const calls = [];
  const bitmap = { width, height, close() { calls.push(["close"]); } };
  const tools = {
    async createImageBitmap(file, options) { calls.push(["decode", file, options]); return bitmap; },
    createCanvas(canvasWidth, canvasHeight) {
      calls.push(["canvas", canvasWidth, canvasHeight]);
      return {
        getContext(kind) {
          assert.equal(kind, "2d");
          return { drawImage(image, x, y, targetWidth, targetHeight) { calls.push(["draw", image, x, y, targetWidth, targetHeight]); } };
        },
        toBlob(callback, mimeType, quality) {
          calls.push(["encode", mimeType, quality]);
          callback(encode ? encode(mimeType) : new Blob(["prepared"], { type: mimeType }));
        },
      };
    },
  };
  return { tools, calls, bitmap };
}

const imageFile = () => new File(["camera image"], "capture.jpg", { type: "image/jpeg" });

test("preparation requests EXIF-aware decoding, rasterizes normalized pixels, caps longest edge, and emits WebP metadata", async () => {
  const { tools, calls, bitmap } = imageTools();
  const file = imageFile();
  const result = await preparePhoto(file, tools);
  assert.deepEqual(calls[0], ["decode", file, { imageOrientation: "from-image" }]);
  assert.deepEqual(calls[1], ["canvas", 2400, 1800]);
  assert.deepEqual(calls[2], ["draw", bitmap, 0, 0, 2400, 1800]);
  assert.deepEqual(calls[3], ["encode", "image/webp", 0.82]);
  assert.deepEqual(calls.at(-1), ["close"]);
  assert.deepEqual({ ...result, blob: undefined }, { blob: undefined, width: 2400, height: 1800, mimeType: "image/webp", byteSize: 8 });
  assert.equal(await result.blob.text(), "prepared");
});

test("portrait orientation uses the decoded dimensions and small images are never upscaled", async () => {
  for (const [width, height, expected] of [[3000, 4000, [1800, 2400]], [600, 400, [600, 400]], [1, 6000, [1, 2400]]]) {
    const { tools } = imageTools({ width, height });
    const result = await preparePhoto(imageFile(), tools);
    assert.deepEqual([result.width, result.height], expected);
  }
});

test("unsupported WebP (null, empty, wrong MIME, or encoder failure) falls back to JPEG at quality 0.84", async () => {
  for (const webp of [null, new Blob([], { type: "image/webp" }), new Blob(["PNG"], { type: "image/png" }), "throws"]) {
    const { tools, calls } = imageTools({ encode(mimeType) {
      if (mimeType === "image/webp") {
        if (webp === "throws") throw new Error("WebP encoder unsupported");
        return webp;
      }
      return new Blob(["jpeg"], { type: "image/jpeg" });
    } });
    const result = await preparePhoto(imageFile(), tools);
    assert.equal(result.mimeType, "image/jpeg");
    assert.equal(result.byteSize, 4);
    assert.deepEqual(calls.filter(([kind]) => kind === "encode"), [["encode", "image/webp", 0.82], ["encode", "image/jpeg", 0.84]]);
  }
});

test("empty, non-image, and original files above 30 MiB are rejected before decoding", async () => {
  const { tools, calls } = imageTools();
  for (const input of [null, {}, new Blob([]), new Blob([], { type: "image/jpeg" }), new Blob(["text"], { type: "text/plain" }), new Blob([new Uint8Array(30 * MiB + 1)], { type: "image/jpeg" })]) {
    await assert.rejects(preparePhoto(input, tools));
  }
  assert.deepEqual(calls, []);
});

test("original input at 30 MiB can be compressed and prepared output accepts exactly 10 MiB", async () => {
  const { tools } = imageTools({ encode: (mimeType) => new Blob([new Uint8Array(10 * MiB)], { type: mimeType }) });
  const result = await preparePhoto(new Blob([new Uint8Array(30 * MiB)], { type: "image/jpeg" }), tools);
  assert.equal(result.byteSize, 10 * MiB);
});

test("prepared blobs above 10 MiB reject and release decoded images", async () => {
  const { tools, calls } = imageTools({ encode: (mimeType) => new Blob([new Uint8Array(10 * MiB + 1)], { type: mimeType }) });
  await assert.rejects(preparePhoto(imageFile(), tools), /10 MiB/);
  assert.deepEqual(calls.at(-1), ["close"]);
});

test("failed JPEG output, invalid dimensions, missing canvas, and decode errors reject without leaking bitmaps", async () => {
  for (const output of [null, new Blob([]), new Blob(["png"], { type: "image/png" })]) {
    const { tools, calls } = imageTools({ encode: () => output });
    await assert.rejects(preparePhoto(imageFile(), tools), /encode/i);
    assert.deepEqual(calls.at(-1), ["close"]);
  }
  for (const dimensions of [{ width: 0 }, { height: NaN }, { width: Infinity }]) {
    const { tools, calls } = imageTools(dimensions);
    await assert.rejects(preparePhoto(imageFile(), tools), /dimensions/i);
    assert.deepEqual(calls.at(-1), ["close"]);
  }
  const { tools, calls } = imageTools();
  tools.createCanvas = () => ({ getContext: () => null });
  await assert.rejects(preparePhoto(imageFile(), tools), /canvas/i);
  assert.deepEqual(calls.at(-1), ["close"]);
  const decodeError = new Error("Cannot decode image");
  await assert.rejects(preparePhoto(imageFile(), { ...tools, createImageBitmap: async () => { throw decodeError; } }), (error) => error === decodeError);
});
