import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  preparePhotoSubmission, finalizePhotoSubmission,
  handlePreparePhotoSubmission, handleFinalizePhotoSubmission,
  createPhotoSubmissionOperations,
} from "../lib/demo-five/photo-submission-service.ts";

const now = Date.parse("2026-11-13T12:00:00Z");
function manifest() {
  return {
    idempotencyKey: randomUUID(),
    photographer: { name: "Ada", email: " ADA@Example.com ", phone: "123", paymentMethod: "Invoice", paymentUrl: "https://example.com/pay" },
    propertyAddress: "123 Example Street",
    notApplicable: [{ category: "interior", photoType: "attic" }, { category: "interior", photoType: "basement" }],
    photos: ["exterior", "exterior", "exterior", "exterior", "interior", "interior", "interior", "interior", "mechanical", "condition"].map((category, i) => ({
      clientPhotoId: `photo-${i}`, photoName: `Photo ${i}`, category,
      photoType: { exterior: "front", interior: "kitchen", mechanical: "hvac", condition: "general_condition" }[category],
      conditionStatus: "good_condition", description: "", capturedAt: "2026-11-13T12:00:00Z",
      width: 1200, height: 900, mimeType: "image/webp", byteSize: 1000,
    })),
  };
}

// The external persistence/storage boundary is injected; validation, orchestration,
// retry decisions, generated paths and HTTP behavior all run as production code.
function fixture() {
  const people = new Map(), sessions = new Map(), objects = new Map();
  const logs = [], deleted = [], signed = [], finalized = [];
  const operations = {
    async consumeRateLimit() { return 0; },
    async findPhotographer(email) { return [...people.values()].find(p => p.email.trim().toLowerCase() === email) ?? null; },
    async savePhotographer(details, id, updatedAt) {
      const row = { ...details, id: id ?? randomUUID(), updatedAt }; people.set(row.id, row); return row;
    },
    async findSession(key) { return structuredClone([...sessions.values()].find(s => s.idempotencyKey === key) ?? null); },
    async createSession(s) {
      if ([...sessions.values()].some(row => row.idempotencyKey === s.idempotencyKey)) throw { code: "23505" };
      sessions.set(s.id, structuredClone(s)); return structuredClone(s);
    },
    async signUpload(path) {
      // Non-upsert signing rejects paths that already exist in Storage.
      if (objects.has(path)) throw { code: "Duplicate", message: "The resource already exists" };
      signed.push(path); return `private-token-${signed.length}`;
    },
    async inspectObject(path) { return objects.get(path) ?? null; },
    async readObjectPrefix(path, length) {
      assert.equal(length, 12);
      return objects.get(path)?.prefix ?? new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]);
    },
    async markTerminal(id, key, status) {
      const s = sessions.get(id);
      if (s?.idempotencyKey !== key || s.status !== "prepared") return false;
      s.status = status; return true;
    },
    async removeObjects(paths) { deleted.push(...paths); paths.forEach(p => objects.delete(p)); },
    async finalize(s, photos, notApplicable) {
      const row = sessions.get(s.id);
      if (row.status === "finalized" && JSON.stringify(row.finalizedPhotos) !== JSON.stringify(photos)) throw { code: "P0001" };
      finalized.push({ photos, notApplicable }); row.status = "finalized"; row.finalizedPhotos = photos;
      return { submissionId: s.id, photographerId: s.photographerId, photoCount: photos.length };
    },
  };
  return { people, sessions, objects, logs, deleted, signed, finalized, operations,
    dependencies: { operations, env: { SB_SECRET: "test-only-secret" }, now: () => now, uuid: randomUUID, logError: message => logs.push(message) } };
}
const request = body => new Request("http://localhost/api/demo-five/submissions", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });
async function prepared(f = fixture(), input = manifest()) {
  const result = await preparePhotoSubmission(input, f.dependencies);
  const photos = input.photos.map(p => ({ ...p, objectPath: result.uploads.find(u => u.clientPhotoId === p.clientPhotoId.trim()).objectPath }));
  photos.forEach(p => f.objects.set(p.objectPath, { mimeType: p.mimeType, byteSize: p.byteSize }));
  return { f, input, result, finalInput: { sessionId: result.sessionId, idempotencyKey: result.idempotencyKey, photos, notApplicable: input.notApplicable } };
}

function manifestWithOther() {
  const input = manifest();
  input.photos.push({ ...input.photos[0], clientPhotoId: "other-1", photoName: "Additional detail", category: "other", photoType: "other", conditionStatus: "not_accessible" });
  return input;
}

test("prepare and finalize preserve an optional Other photo alongside all required photos", async () => {
  const input = manifestWithOther();
  const { f, result, finalInput } = await prepared(fixture(), input);
  assert.equal(result.uploads.length, 11);
  const response = await handleFinalizePhotoSubmission(request(finalInput), f.dependencies);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).photoCount, 11);
  assert.deepEqual(f.finalized[0].photos.find(photo => photo.clientPhotoId === "other-1"), { ...finalInput.photos[10], capturedAt: "2026-11-13T12:00:00.000Z" });
  assert.deepEqual(f.sessions.get(result.sessionId).preparedManifest.photos.find(photo => photo.clientPhotoId === "other-1"), { ...input.photos[10], capturedAt: "2026-11-13T12:00:00.000Z" });
});

for (const category of ["exterior", "interior", "mechanical", "condition"]) {
  test(`Other photos cannot replace the ${category} minimum at either API boundary`, async () => {
    const input = manifestWithOther();
    const photo = input.photos.find(photo => photo.category === category);
    photo.category = "other"; photo.photoType = "other";
    const rejected = fixture();
    assert.equal((await handlePreparePhotoSubmission(request(input), rejected.dependencies)).status, 400);
    assert.equal(rejected.sessions.size, 0);

    const { f, result, finalInput } = await prepared(fixture(), manifestWithOther());
    const finalPhoto = finalInput.photos.find(photo => photo.category === category);
    finalPhoto.category = "other"; finalPhoto.photoType = "other";
    assert.equal((await handleFinalizePhotoSubmission(request(finalInput), f.dependencies)).status, 400);
    assert.equal(f.finalized.length, 0);
    assert.equal(f.sessions.get(result.sessionId).status, "prepared");
  });
}

for (const photoType of ["front", "kitchen", "hvac", "general_condition"]) {
  test(`Other rejects the unrelated ${photoType} type at both API boundaries`, async () => {
    const input = manifestWithOther(); input.photos[10].photoType = photoType;
    const rejected = fixture();
    assert.equal((await handlePreparePhotoSubmission(request(input), rejected.dependencies)).status, 400);
    assert.equal(rejected.sessions.size, 0);

    const { f, finalInput } = await prepared(fixture(), manifestWithOther());
    finalInput.photos[10].photoType = photoType;
    assert.equal((await handleFinalizePhotoSubmission(request(finalInput), f.dependencies)).status, 400);
    assert.equal(f.finalized.length, 0);
  });
}

test("HTTP boundaries reject malformed JSON and absent configuration safely", async () => {
  for (const handle of [handlePreparePhotoSubmission, handleFinalizePhotoSubmission]) {
    assert.equal((await handle(request("{"), { env: {} })).status, 400);
    const response = await handle(request(manifest()), { env: {} });
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /SB_SECRET|SUPABASE_URL/);
  }
});

for (const [name, mutate] of [
  ["invalid payment HTTPS", m => { m.photographer.paymentUrl = "http://example.com"; }],
  ["insufficient minimums", m => m.photos.pop()],
  ["duplicate IDs", m => { m.photos[1].clientPhotoId = m.photos[0].clientPhotoId; }],
  ["wrong category", m => { m.photos[0].category = "other"; }],
  ["wrong type", m => { m.photos[0].photoType = "kitchen"; }],
  ["wrong status", m => { m.photos[0].conditionStatus = "fine"; }],
  ["oversized photo", m => { m.photos[0].byteSize = 10485761; }],
  ["too many photos", m => { m.photos = Array.from({ length: 101 }, (_, i) => ({ ...m.photos[i % 10], clientPhotoId: `p${i}` })); }],
  ["total bytes over 500 MiB", m => { m.photos = Array.from({ length: 51 }, (_, i) => ({ ...m.photos[i % 10], clientPhotoId: `p${i}`, byteSize: 10485760 })); }],
  ["client-selected path", m => { m.photos[0].objectPath = "another/session/image.webp"; }],
  ["non UUID idempotency key", m => { m.idempotencyKey = "guessable"; }],
]) test(`prepare rejects ${name} before persistence or token creation`, async () => {
  const f = fixture(), input = manifest(); mutate(input);
  assert.equal((await handlePreparePhotoSubmission(request(input), f.dependencies)).status, 400);
  assert.equal(f.people.size, 0); assert.equal(f.sessions.size, 0); assert.equal(f.signed.length, 0);
});

test("prepare creates normalized contact, private paths, two-hour session and signed tokens", async () => {
  const f = fixture(), input = manifest(); input.photos[0].clientPhotoId = "../../untrusted-name";
  const response = await handlePreparePhotoSubmission(request(input), f.dependencies);
  assert.equal(response.status, 201);
  const result = await response.json(), s = f.sessions.get(result.sessionId);
  assert.equal(f.people.size, 1); assert.equal([...f.people.values()][0].email, "ada@example.com");
  assert.equal(Date.parse(s.expiresAt) - now, 7200000);
  assert.equal(result.uploads.length, 10);
  for (const u of result.uploads) {
    assert.match(u.objectPath, new RegExp(`^${s.photographerId}/${s.id}/[a-f0-9-]+\\.webp$`));
    assert.match(u.signedToken, /^private-token-/);
    assert.doesNotMatch(u.objectPath, /untrusted|photo-/);
  }
  assert.deepEqual(s.expectedPaths.map(p => Object.keys(p).sort()), Array(10).fill(["clientPhotoId", "objectPath"]));
});

test("prepare reuses case-insensitive email, updates contact/payment and retries reordered manifests", async () => {
  const f = fixture(), id = randomUUID();
  f.people.set(id, { ...manifest().photographer, id, email: " Ada@Example.COM " });
  const input = manifest(), first = await preparePhotoSubmission(input, f.dependencies);
  input.photos.reverse(); input.notApplicable.reverse(); input.photographer.phone = "456"; input.photographer.paymentUrl = "https://example.com/new";
  const second = await preparePhotoSubmission(input, f.dependencies);
  assert.equal(second.sessionId, first.sessionId); assert.equal(f.sessions.size, 1); assert.equal(f.people.size, 1);
  assert.equal(f.people.get(id).phone, "456"); assert.equal(f.people.get(id).paymentUrl, "https://example.com/new");
  assert.deepEqual(second.uploads.map(u => u.objectPath), first.uploads.map(u => u.objectPath));
});

test("prepare after partial upload preserves verified objects and signs only missing paths", async () => {
  const { f, input, result } = await prepared();
  const missing = result.uploads.slice(3);
  missing.forEach(u => f.objects.delete(u.objectPath));
  f.signed.length = 0;
  const retry = await preparePhotoSubmission(input, f.dependencies);
  assert.equal(retry.sessionId, result.sessionId);
  assert.deepEqual(retry.uploads.map(u => u.objectPath), result.uploads.map(u => u.objectPath));
  assert.deepEqual(f.signed, missing.map(u => u.objectPath));
  for (const u of retry.uploads.slice(0, 3)) {
    assert.equal(u.alreadyUploaded, true); assert.equal(u.signedToken, null);
  }
  for (const u of retry.uploads.slice(3)) {
    assert.equal(u.alreadyUploaded, false); assert.match(u.signedToken, /^private-token-/);
  }
});

test("prepare after finalization returns uploaded paths without signing and finalize retry still succeeds", async () => {
  const { f, input, result, finalInput } = await prepared();
  const finalized = await finalizePhotoSubmission(finalInput, f.dependencies);
  f.signed.length = 0;
  const retry = await preparePhotoSubmission(input, f.dependencies);
  assert.equal(retry.sessionId, result.sessionId); assert.equal(f.signed.length, 0);
  assert.ok(retry.uploads.every(u => u.alreadyUploaded === true && u.signedToken === null));
  assert.deepEqual(await finalizePhotoSubmission(finalInput, f.dependencies), finalized);
});

test("prepare retries reject mismatched existing object metadata instead of marking it uploaded", async () => {
  for (const metadata of [{ mimeType: "image/jpeg", byteSize: 1000 }, { mimeType: "image/webp", byteSize: 999 }]) {
    const { f, input, result } = await prepared();
    f.objects.set(result.uploads[0].objectPath, metadata);
    const response = await handlePreparePhotoSubmission(request(input), f.dependencies);
    assert.equal(response.status, 422);
    assert.equal((await response.json()).code, "OBJECT_MISMATCH");
    assert.equal(f.sessions.get(result.sessionId).status, "failed");
  }
});

test("whitespace-padded client IDs round-trip through prepare and finalize with normalized RPC metadata", async () => {
  const input = manifest(); input.photos[0].clientPhotoId = "  photo-0 \t";
  const { f, result, finalInput } = await prepared(fixture(), input);
  assert.equal(result.uploads[0].clientPhotoId, "photo-0");
  const finalized = await finalizePhotoSubmission(finalInput, f.dependencies);
  assert.equal(finalized.photoCount, 10);
  assert.equal(f.finalized[0].photos[0].clientPhotoId, "photo-0");
});

for (const [name, mutate] of [
  ["photo size", m => m.photos[0].byteSize++], ["MIME", m => { m.photos[0].mimeType = "image/jpeg"; }],
  ["address", m => { m.propertyAddress = "Other address"; }], ["N/A", m => { m.notApplicable = []; }],
  ["photo IDs", m => { m.photos[0].clientPhotoId = "changed"; }], ["photographer", m => { m.photographer.email = "other@example.com"; }],
]) test(`prepare rejects changed ${name} under the same idempotency key`, async () => {
  const { f, input } = await prepared(); mutate(input);
  assert.equal((await handlePreparePhotoSubmission(request(input), f.dependencies)).status, 409);
  assert.equal(f.sessions.size, 1); assert.equal(f.signed.length, 10);
});

test("expired prepare/finalize mark the session expired and delete only its recorded paths", async () => {
  for (const phase of ["prepare", "finalize"]) {
    const { f, input, finalInput, result } = await prepared();
    f.dependencies.now = () => now + 7200000;
    const response = await (phase === "prepare" ? handlePreparePhotoSubmission(request(input), f.dependencies) : handleFinalizePhotoSubmission(request(finalInput), f.dependencies));
    assert.equal(response.status, 410);
    assert.equal(f.sessions.get(result.sessionId).status, "expired");
    assert.deepEqual(f.deleted.sort(), result.uploads.map(u => u.objectPath).sort());
  }
});

test("expiry losing its conditional update to finalize recovers the committed result for both endpoints", async () => {
  for (const phase of ["prepare", "finalize"]) {
    const { f, input, finalInput, result } = await prepared();
    const mark = f.operations.markTerminal;
    let committed;
    f.dependencies.now = () => now + 7200000;
    f.operations.markTerminal = async (...args) => {
      // checkSession has already read prepared + expired. A request which
      // entered before expiry commits while the terminal update waits for it.
      committed = await finalizePhotoSubmission(finalInput, { ...f.dependencies, now: () => now });
      return mark(...args);
    };
    const response = await (phase === "prepare" ? handlePreparePhotoSubmission(request(input), f.dependencies) : handleFinalizePhotoSubmission(request(finalInput), f.dependencies));
    assert.equal(response.status, phase === "prepare" ? 201 : 200);
    const body = await response.json();
    if (phase === "prepare") {
      assert.equal(body.idempotencyKey, input.idempotencyKey);
      assert.ok(body.uploads.every(u => u.alreadyUploaded && u.signedToken === null));
      assert.deepEqual(await finalizePhotoSubmission(finalInput, f.dependencies), committed);
    } else assert.deepEqual(body, committed);
    assert.equal(f.sessions.get(result.sessionId).status, "finalized");
    assert.equal(f.deleted.length, 0); assert.equal(f.sessions.size, 1);
  }
});

test("failed expiry coordination stays retryable instead of authorizing a fresh key", async () => {
  const { f, finalInput, result } = await prepared();
  f.dependencies.now = () => now + 7200000;
  f.operations.markTerminal = async () => { throw new Error("Temporary database failure"); };
  const response = await handleFinalizePhotoSubmission(request(finalInput), f.dependencies);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "RETRYABLE_FAILURE");
  assert.equal(f.sessions.get(result.sessionId).status, "prepared");
  assert.equal(f.deleted.length, 0);
});

test("finalize checks all objects, sorts metadata/N/A, and returns an idempotent success after expiry", async () => {
  const { f, finalInput, result } = await prepared();
  const first = await finalizePhotoSubmission(finalInput, f.dependencies);
  assert.deepEqual(first, { submissionId: result.sessionId, photographerId: [...f.people.keys()][0], photoCount: 10 });
  assert.equal(f.finalized.length, 1);
  assert.equal(f.finalized[0].photos[0].capturedAt, "2026-11-13T12:00:00.000Z");
  assert.deepEqual(f.finalized[0].notApplicable, [{ category: "interior", photoType: "attic" }, { category: "interior", photoType: "basement" }]);
  f.dependencies.now = () => now + 99999999; finalInput.photos.reverse(); finalInput.notApplicable.reverse();
  assert.deepEqual(await finalizePhotoSubmission(finalInput, f.dependencies), first);
  assert.equal(f.deleted.length, 0);
});

test("missing objects leave finalize retryable and do not call RPC", async () => {
  const { f, finalInput } = await prepared(); const p = finalInput.photos[0]; f.objects.delete(p.objectPath);
  assert.equal((await handleFinalizePhotoSubmission(request(finalInput), f.dependencies)).status, 409);
  assert.equal(f.finalized.length, 0); assert.equal(f.deleted.length, 0);
  f.objects.set(p.objectPath, { mimeType: p.mimeType, byteSize: p.byteSize });
  assert.equal((await handleFinalizePhotoSubmission(request(finalInput), f.dependencies)).status, 200);
});

test("allowed image metadata cannot disguise arbitrary bytes or a different image signature", async () => {
  for (const prefix of [new TextEncoder().encode("not an image"), new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), new Uint8Array([255, 216, 255, 224])]) {
    const { f, finalInput, result } = await prepared();
    f.objects.get(finalInput.photos[0].objectPath).prefix = prefix;
    const response = await handleFinalizePhotoSubmission(request(finalInput), f.dependencies);
    assert.equal(response.status, 422);
    assert.equal((await response.json()).code, "OBJECT_MISMATCH");
    assert.equal(f.finalized.length, 0);
    assert.equal(f.sessions.get(result.sessionId).status, "failed");
    assert.deepEqual(f.deleted.sort(), result.uploads.map(u => u.objectPath).sort());
  }
});

test("JPEG signature matching its declared MIME can finalize", async () => {
  const input = manifest(); input.photos[0].mimeType = "image/jpeg";
  const { f, finalInput } = await prepared(fixture(), input);
  f.objects.get(finalInput.photos[0].objectPath).prefix = new Uint8Array([255, 216, 255, 224]);
  assert.equal((await finalizePhotoSubmission(finalInput, f.dependencies)).photoCount, 10);
});

test("prefix reads request a bounded range and cancel the stream without buffering an object", async () => {
  let cancelled = false, reads = 0;
  const ops = createPhotoSubmissionOperations({ storage: { from() { return {
    async createSignedUrl(path, seconds) {
      assert.equal(path, "owned/photo.webp"); assert.equal(seconds, 60);
      return { data: { signedUrl: "https://storage.example/private" }, error: null };
    },
  }; } } }, async (url, init) => {
    assert.equal(url, "https://storage.example/private");
    assert.equal(init.headers.Range, "bytes=0-11");
    return new Response(new ReadableStream({
      pull(controller) { reads++; controller.enqueue(new Uint8Array(32)); },
      cancel() { cancelled = true; },
    }), { status: 200 });
  });
  assert.equal((await ops.readObjectPrefix("owned/photo.webp", 12)).length, 12);
  assert.equal(cancelled, true); assert.ok(reads <= 2);
});

for (const change of [{ mimeType: "image/jpeg", byteSize: 1000 }, { mimeType: "image/webp", byteSize: 999 }]) {
  test(`object metadata mismatch ${JSON.stringify(change)} is terminal and cleaned up`, async () => {
    const { f, finalInput, result } = await prepared(); f.objects.set(finalInput.photos[0].objectPath, change);
    assert.equal((await handleFinalizePhotoSubmission(request(finalInput), f.dependencies)).status, 422);
    assert.equal(f.finalized.length, 0); assert.equal(f.sessions.get(result.sessionId).status, "failed");
    assert.equal(f.deleted.length, 10);
  });
}

test("tampered paths, keys, metadata and incomplete final manifests cannot reach storage or RPC", async () => {
  for (const mutate of [m => { m.photos[0].objectPath = "victim/photo.webp"; }, m => { m.idempotencyKey = randomUUID(); }, m => { m.photos[0].byteSize++; }, m => { m.photos.pop(); }]) {
    const { f, finalInput } = await prepared(); mutate(finalInput);
    f.operations.inspectObject = async () => { assert.fail("must validate before inspecting objects"); };
    const r = await handleFinalizePhotoSubmission(request(finalInput), f.dependencies);
    assert.ok([400, 404, 409].includes(r.status)); assert.equal(f.finalized.length, 0); assert.equal(f.deleted.length, 0);
  }
});

test("transient RPC failure is sanitized, logged without payload and remains retryable", async () => {
  const { f, finalInput, result } = await prepared(); const actual = f.operations.finalize;
  f.operations.finalize = async () => { throw new Error("secret ada@example.com private-token 123 Example Street"); };
  const response = await handleFinalizePhotoSubmission(request(finalInput), f.dependencies);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret|ada@|private-token|Example Street/);
  assert.equal(f.logs.length, 1); assert.doesNotMatch(f.logs.join(" "), /secret|ada@|private-token|Example Street/);
  assert.equal(f.sessions.get(result.sessionId).status, "prepared"); assert.equal(f.deleted.length, 0);
  f.operations.finalize = actual; assert.equal((await finalizePhotoSubmission(finalInput, f.dependencies)).photoCount, 10);
});

test("terminal RPC errors attempt cleanup and a cleanup error cannot expose details", async () => {
  const { f, finalInput, result } = await prepared();
  f.operations.finalize = async () => { throw { code: "23514", message: "private database details" }; };
  f.operations.removeObjects = async paths => { f.deleted.push(...paths); throw new Error("private token"); };
  const response = await handleFinalizePhotoSubmission(request(finalInput), f.dependencies);
  assert.equal(response.status, 422); assert.equal(f.sessions.get(result.sessionId).status, "failed");
  assert.equal(f.deleted.length, 10); assert.doesNotMatch(f.logs.join(" "), /private/);
});

test("cleanup never deletes a session finalized concurrently", async () => {
  const { f, finalInput, result } = await prepared();
  f.operations.finalize = async () => { f.sessions.get(result.sessionId).status = "finalized"; throw { code: "P0001" }; };
  await handleFinalizePhotoSubmission(request(finalInput), f.dependencies);
  assert.equal(f.deleted.length, 0);
});

test("Supabase photographer lookup escapes ILIKE metacharacters and exact-matches normalized candidates", async () => {
  let pattern;
  const client = { from(table) {
    assert.equal(table, "photographers");
    return { select() { return this; }, ilike(_column, value) { pattern = value; return this; }, order() { return this; },
      async range() { return { data: [{ id: "wrong", email: "someone-a_%\\@example.com" }, { id: "right", email: " A_%\\@EXAMPLE.COM " }], error: null }; } };
  } };
  const ops = createPhotoSubmissionOperations(client);
  assert.equal((await ops.findPhotographer("a_%\\@example.com")).id, "right");
  assert.equal(pattern, "%a\\_\\%\\\\@example.com%");
});

test("Supabase signs uploads without overwrite and uses private bucket object metadata", async () => {
  const actions = [];
  const ops = createPhotoSubmissionOperations({ storage: { from(bucket) {
    assert.equal(bucket, "photographer-photos");
    return {
      async createSignedUploadUrl(path, options) { actions.push({ path, options }); return { data: { token: "signed" }, error: null }; },
      async info() { return { data: { contentType: "image/webp", size: 1000 }, error: null }; },
    };
  } } });
  assert.equal(await ops.signUpload("owned/path.webp"), "signed");
  assert.deepEqual(actions, [{ path: "owned/path.webp", options: { upsert: false } }]);
  assert.deepEqual(await ops.inspectObject("owned/path.webp"), { mimeType: "image/webp", byteSize: 1000 });
});
