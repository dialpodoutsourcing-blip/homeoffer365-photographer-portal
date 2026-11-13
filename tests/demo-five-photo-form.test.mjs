import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IDBFactory } from "fake-indexeddb";
import { createIndexedDbPhotoDraftStore, createPhotoDraftKey } from "../lib/demo-five/photo-draft-store.ts";

const moduleUrl = new URL("../lib/demo-five/upload-photo-draft.ts", import.meta.url);
async function subject() {
  assert.ok(await readFile(moduleUrl, "utf8").catch(() => ""), "upload orchestrator must exist");
  return import(moduleUrl.href);
}
function draft() {
  const photos = ["exterior", "exterior", "exterior", "exterior", "interior", "interior", "interior", "interior", "mechanical", "condition"].map((category, index) => ({
    clientPhotoId: `photo-${index}`, photoName: `View ${index}`, category,
    photoType: "other", conditionStatus: "good_condition", description: "", capturedAt: "2026-11-13T12:00:00.000Z",
    width: 100, height: 80, mimeType: "image/webp", byteSize: 5, blob: new Blob(["image"], { type: "image/webp" }),
  }));
  return { version: 1, browserDraftId: "browser-1", draftKey: createPhotoDraftKey("123 Main Street", "browser-1"),
    propertyAddress: "123 Main Street", photographer: { name: "Ada", email: "ada@example.com", phone: "555-555-5555", paymentMethod: "Invoice", paymentUrl: "https://example.com/pay" },
    photos, notApplicable: [], updatedAt: "2026-11-13T12:00:00.000Z" };
}
function server(d, { finalizeFails = false, alreadyUploaded = [] } = {}) {
  const calls = [];
  return { calls, fetch: async (url, init) => {
    const body = JSON.parse(init.body); calls.push({ url, body });
    if (url.endsWith("prepare")) return Response.json({ sessionId: "session-1", idempotencyKey: body.idempotencyKey,
      uploads: d.photos.map(p => ({ clientPhotoId: p.clientPhotoId, objectPath: `owner/session/${p.clientPhotoId}.webp`, alreadyUploaded: alreadyUploaded.includes(p.clientPhotoId), signedToken: alreadyUploaded.includes(p.clientPhotoId) ? null : `token-${p.clientPhotoId}` })) });
    return finalizeFails ? Response.json({ error: "Try again", code: "RETRYABLE_FAILURE" }, { status: 503 }) : Response.json({ submissionId: "submission-1", photographerId: "owner", photoCount: 10 });
  } };
}
async function savedStore(value) {
  const store = createIndexedDbPhotoDraftStore(new IDBFactory());
  await store.save(value);
  return store;
}

test("uploads at concurrency three, persists completed IDs, and only confirms after finalize", async () => {
  const { uploadPhotoDraft } = await subject();
  const d = draft(), api = server(d), progress = [], store = createIndexedDbPhotoDraftStore(new IDBFactory());
  await store.save(d);
  let active = 0, maximum = 0;
  const result = await uploadPhotoDraft(d, api.fetch, async (entry, photo) => {
    assert.equal(photo.blob.size, 5); assert.ok(entry.signedToken);
    active++; maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 3)); active--;
  }, { store, onProgress: value => progress.push(value), isOnline: () => true });
  assert.equal(result.ok, true); assert.equal(result.submission.submissionId, "submission-1");
  assert.equal(maximum, 3);
  assert.equal((await store.load(d.draftKey)).upload.completedPhotoIds.length, 10, "orchestrator must never clear local draft");
  assert.deepEqual(api.calls.map(c => c.url), ["/api/demo-five/submissions/prepare", "/api/demo-five/submissions/finalize"]);
  assert.equal("blob" in api.calls[0].body.photos[0], false);
  assert.equal(api.calls[1].body.photos[0].objectPath, "owner/session/photo-0.webp");
  assert.ok(progress.every(p => p.completed >= 0 && p.completed <= p.total && p.total === 10));
  assert.equal(progress.at(-1).phase, "complete");
});

test("partial failure preserves draft and retries only failed items with stable prepare state", async () => {
  const { uploadPhotoDraft } = await subject();
  const d = draft(), api = server(d), attempts = [];
  const store = createIndexedDbPhotoDraftStore(new IDBFactory());
  await store.save(d);
  const first = await uploadPhotoDraft(d, api.fetch, async entry => {
    attempts.push(entry.clientPhotoId); if (entry.clientPhotoId === "photo-2") throw new Error("Connection interrupted");
  }, { store });
  assert.equal(first.ok, false); assert.equal(api.calls.length, 1);
  const restored = await store.load(d.draftKey);
  assert.equal(restored.photos.length, 10); assert.equal(restored.upload.completedPhotoIds.length, 9);
  const second = await uploadPhotoDraft(restored, api.fetch, async entry => attempts.push(entry.clientPhotoId), { store });
  assert.equal(second.ok, true); assert.equal(attempts.length, 11); assert.equal(attempts.at(-1), "photo-2");
  assert.equal(api.calls.filter(c => c.url.endsWith("prepare")).length, 1);
});

test("offline, invalid minimums, and local quota failures make no remote requests", async () => {
  const { uploadPhotoDraft } = await subject();
  for (const kind of ["offline", "minimums", "quota"]) {
    const d = draft(); if (kind === "minimums") d.photos.pop();
    const api = server(d), store = await savedStore(d);
    if (kind === "quota") store.beginSubmission = async () => { throw new DOMException("Full", "QuotaExceededError"); };
    const result = await uploadPhotoDraft(d, api.fetch, async () => assert.fail("must not upload"), {
      store, isOnline: () => kind !== "offline",
    });
    assert.equal(result.ok, false); assert.equal(api.calls.length, 0); assert.ok(d.photos.length >= 9);
  }
});

test("quota failure before preparing leaves a new draft editable and preserves an existing retry key", async () => {
  const { uploadPhotoDraft } = await subject();
  for (const retry of [false, true]) {
    const d = draft(), api = server(d);
    if (retry) d.upload = { idempotencyKey: "existing-key", completedPhotoIds: [] };
    const previous = d.upload;
    const store = await savedStore(d);
    store.beginSubmission = async () => { throw new DOMException("Full", "QuotaExceededError"); };
    const result = await uploadPhotoDraft(d, api.fetch, async () => assert.fail("must not upload"), {
      store,
    });
    assert.equal(result.ok, false);
    assert.equal(d.upload, previous, "failed local save must not introduce a new upload lock or lose an existing retry key");
    assert.equal(api.calls.length, 0);
    assert.match(result.error, /free.*space/i);
    assert.equal(d.photos.length, 10);
  }
});

async function formState() {
  const url = new URL("../lib/demo-five/photo-form-state.ts", import.meta.url);
  assert.ok(await readFile(url, "utf8").catch(() => ""), "photo form transition reducer must exist");
  return import(url.href);
}

test("photo editor transitions cannot overlap capture, submission, or confirmation", async () => {
  const { initialPhotoFormState, photoFormReducer } = await formState();
  const photo = draft().photos[0], edit = { image: photo, existing: photo, category: photo.category, capturedAt: photo.capturedAt };
  let state = photoFormReducer(initialPhotoFormState, { type: "captureStarted" });
  state = photoFormReducer(state, { type: "openEditor", edit: { ...edit, viewOnly: true } });
  assert.equal(state.edit, null, "view cannot open while image preparation is pending");
  state = photoFormReducer(state, { type: "captureFinished", edit });
  assert.equal(state.edit, edit);
  const firstRevision = state.editorRevision;
  state = photoFormReducer(state, { type: "openEditor", edit: { ...edit, existing: draft().photos[1] } });
  assert.ok(state.editorRevision > firstRevision, "a changed edit must remount its form state");
  state = photoFormReducer(state, { type: "submissionStarted" });
  assert.equal(state.edit, null);
  state = photoFormReducer(state, { type: "openEditor", edit });
  assert.equal(state.edit, null);
  state = photoFormReducer(state, { type: "submissionSucceeded" });
  state = photoFormReducer(state, { type: "openEditor", edit });
  assert.equal(state.edit, null); assert.equal(state.submitted, true);
});

test("restoring a visit resets terminal failure, progress, editor, and confirmation state", async () => {
  const { initialPhotoFormState, photoFormReducer } = await formState();
  const state = { ...initialPhotoFormState, terminalFailure: true, error: "Expired", busy: true, submitted: true,
    edit: { existing: draft().photos[0] }, progress: { phase: "uploading", completed: 3, total: 10, currentPhotoName: "Previous visit" } };
  const restored = photoFormReducer(state, { type: "draftRestored" });
  assert.equal(restored.terminalFailure, false); assert.equal(restored.progress, null);
  assert.equal(restored.error, ""); assert.equal(restored.edit, null);
  assert.equal(restored.submitted, false); assert.equal(restored.submitting, false); assert.equal(restored.busy, false);
});

test("double submit shares one operation and finalized retries skip every uploaded object", async () => {
  const { uploadPhotoDraft } = await subject();
  const d = draft(), api = server(d, { alreadyUploaded: d.photos.map(p => p.clientPhotoId) });
  const store = await savedStore(d);
  const upload = async () => assert.fail("already uploaded objects must be skipped");
  const [first, second] = await Promise.all([uploadPhotoDraft(d, api.fetch, upload, { store }), uploadPhotoDraft(d, api.fetch, upload, { store })]);
  assert.equal(first.ok, true); assert.equal(second.ok, true); assert.equal(api.calls.length, 2);
});

test("independent restored tabs acquire one persisted attempt and finalize only one photo set", async () => {
  const { uploadPhotoDraft } = await subject();
  const factory = new IDBFactory(), leftStore = createIndexedDbPhotoDraftStore(factory), rightStore = createIndexedDbPhotoDraftStore(factory);
  const original = draft(); await leftStore.save(original);
  const left = await leftStore.load(original.draftKey), right = await rightStore.load(original.draftKey);
  assert.notEqual(left, right);
  const api = server(original), keys = new Set(), finalized = new Map();
  const fetcher = async (url, init) => {
    const body = JSON.parse(init.body);
    if (url.endsWith("prepare")) keys.add(body.idempotencyKey);
    if (url.endsWith("finalize")) finalized.set(body.idempotencyKey, body.photos.length);
    return api.fetch(url, init);
  };
  const results = await Promise.all([
    uploadPhotoDraft(left, fetcher, async () => {}, { store: leftStore }),
    uploadPhotoDraft(right, fetcher, async () => {}, { store: rightStore }),
  ]);
  assert.ok(results.some(result => result.ok));
  assert.equal(keys.size, 1, "separate restored copies must never mint separate attempt keys");
  assert.equal(left.upload.idempotencyKey, right.upload.idempotencyKey);
  assert.equal([...finalized.values()].reduce((sum, count) => sum + count, 0), 10);
  assert.equal((await rightStore.load(original.draftKey)).upload.idempotencyKey, left.upload.idempotencyKey);
  assert.equal((await uploadPhotoDraft(right, fetcher, async () => {}, { store: rightStore })).ok, true);
  await assert.rejects(leftStore.save(original), { name: "PhotoDraftConflictError" });
  await leftStore.delete(original.draftKey);
  const callCount = api.calls.length;
  assert.equal((await uploadPhotoDraft(right, fetcher, async () => {}, { store: rightStore })).ok, false);
  assert.equal(api.calls.length, callCount, "a tab holding a completed/deleted draft cannot create another attempt");
});

test("submission reloads authoritative saved photos before preparing a stale restored copy", async () => {
  const { uploadPhotoDraft } = await subject();
  const store = createIndexedDbPhotoDraftStore(new IDBFactory()), original = draft(); await store.save(original);
  const stale = await store.load(original.draftKey), newer = await store.load(original.draftKey);
  newer.photos[0].photoName = "Authoritative saved name"; await store.save(newer);
  const api = server(newer);
  assert.equal((await uploadPhotoDraft(stale, api.fetch, async () => {}, { store })).ok, true);
  assert.equal(api.calls[0].body.photos[0].photoName, "Authoritative saved name");
  assert.equal(stale.photos[0].photoName, "Authoritative saved name");
});

test("finalize failure preserves retry state and does not report complete", async () => {
  const { uploadPhotoDraft } = await subject();
  const d = draft(), api = server(d, { finalizeFails: true }), progress = [];
  const result = await uploadPhotoDraft(d, api.fetch, async () => {}, { store: await savedStore(d), onProgress: p => progress.push(p) });
  assert.equal(result.ok, false); assert.equal(result.code, "RETRYABLE_FAILURE");
  assert.equal(d.photos.length, 10); assert.equal(d.upload.completedPhotoIds.length, 10);
  assert.equal(progress.some(p => p.phase === "complete"), false);
});

test("missing objects at finalize reconcile server state before retrying missing uploads", async () => {
  const { uploadPhotoDraft } = await subject();
  const d = draft(), api = server(d), attempts = [];
  const store = await savedStore(d);
  let finalizeCount = 0;
  const fetch = async (url, init) => {
    if (url.endsWith("finalize") && finalizeCount++ === 0) return Response.json({ error: "Missing object", code: "UPLOAD_INCOMPLETE" }, { status: 409 });
    if (url.endsWith("prepare") && finalizeCount > 0) {
      const response = await api.fetch(url, init), body = await response.json();
      body.uploads = body.uploads.map(entry => ({ ...entry, alreadyUploaded: entry.clientPhotoId !== "photo-2", signedToken: entry.clientPhotoId === "photo-2" ? entry.signedToken : null }));
      return Response.json(body);
    }
    return api.fetch(url, init);
  };
  const upload = async entry => attempts.push(entry.clientPhotoId);
  assert.equal((await uploadPhotoDraft(d, fetch, upload, { store })).ok, false);
  assert.equal((await uploadPhotoDraft(d, fetch, upload, { store })).ok, true);
  assert.equal(attempts.length, 11); assert.equal(attempts.at(-1), "photo-2");
});

test("lost upload responses reconcile existing objects without overwriting them", async () => {
  const { uploadPhotoDraft } = await subject();
  const d = draft(), api = server(d), attempts = [];
  const store = await savedStore(d);
  const first = await uploadPhotoDraft(d, api.fetch, async entry => {
    attempts.push(entry.clientPhotoId);
    if (entry.clientPhotoId === "photo-2") throw Object.assign(new Error("Already exists"), { code: "RECONCILE_UPLOAD" });
  }, { store });
  assert.equal(first.ok, false);
  const retry = server(d, { alreadyUploaded: d.photos.map(p => p.clientPhotoId) });
  assert.equal((await uploadPhotoDraft(d, retry.fetch, async () => assert.fail("must not overwrite"), { store })).ok, true);
  assert.equal(attempts.length, 10);
});

test("signed transport encodes path and token and rejects missing or insecure origins", async () => {
  const { uploadToSignedPhotoUrl } = await subject();
  const p = draft().photos[0], calls = [];
  const fetch = async (url, init) => { calls.push({ url, init }); return new Response("{}"); };
  await uploadToSignedPhotoUrl("https://project.supabase.co", { objectPath: "owner/a space/image+#.webp", signedToken: "a+b&c", alreadyUploaded: false, clientPhotoId: p.clientPhotoId }, p, fetch);
  assert.equal(calls[0].url, "https://project.supabase.co/storage/v1/object/upload/sign/photographer-photos/owner/a%20space/image%2B%23.webp?token=a%2Bb%26c");
  assert.equal(calls[0].init.method, "PUT");
  for (const origin of ["", "http://project.supabase.co", "https://user:password@project.supabase.co", "https://project.supabase.co/path"]) {
    await assert.rejects(uploadToSignedPhotoUrl(origin, { objectPath: "x", signedToken: "t" }, p, fetch), /configuration/i);
  }
  assert.equal(calls.length, 1);
});

test("Demo 5 exposes its scoped camera, editor, persistence, and accessible form contracts", async () => {
  const read = name => readFile(new URL(`../components/photographer-guide/${name}.tsx`, import.meta.url), "utf8").catch(() => "");
  const [form, category, editor, styles] = await Promise.all([read("demo-five-submission-form"), read("demo-five-photo-category"), read("demo-five-photo-editor"), readFile(new URL("../app/globals.css", import.meta.url), "utf8")]);
  assert.ok(form, "Demo Five form must exist");
  assert.doesNotMatch(form, /Google Drive|driveLink/);
  for (const name of ["photographerName", "email", "phone", "paymentMethod", "paymentUrl", "propertyAddress"]) assert.ok(form.includes(`name="${name}"`));
  for (const helper of ["findAddressLocalities", "applyAddressLocality", "formatAddressLocality", "createIndexedDbPhotoDraftStore", "validatePhotoMinimums", "SubmissionConfirmation"]) assert.ok(form.includes(helper));
  assert.match(form, /4 Exterior.*4 Interior.*1 Mechanical.*1 Condition/);
  assert.match(category, /accept="image\/\*" capture="environment"/);
  assert.match(category, /addEventListener\("cancel"/);
  assert.match(category, /Choose (?:an )?image/);
  assert.doesNotMatch(category, /demo-five-type-hint|getPhotoTypeOptions/);
  assert.match(category, /OPTIONAL_FEATURES\[category\]\.length\s*>\s*0/);
  assert.match(category, /<details className="demo-five-na-disclosure">/);
  assert.match(category, /<summary>Mark feature N\/A<\/summary>/);
  assert.match(styles, /@media \(max-width: 620px\)[\s\S]*?\.demo-five-photo-form \.demo-five-category > summary, \.demo-five-photo-form \.demo-five-category-content/);
  for (const action of ["Take Photo", "View", "Retake", "Remove", "N\/A"]) assert.match(category, new RegExp(action));
  assert.match(editor, /role="dialog"/); assert.match(editor, /aria-modal="true"/);
  assert.match(editor, /Photo name/); assert.match(editor, /Photo type/); assert.match(editor, /Condition status/); assert.match(editor, /Description/);
  assert.match(editor, /\.focus\(/); assert.match(editor, /validateDraftPhoto/);
  assert.match(form, /returnFocus: document\.activeElement/);
  assert.match(editor, /edit\.returnFocus/);
});

test("restore options remain visible alongside a preserved-corruption warning", async () => {
  const hook = registerHooks({ load(url, context, nextLoad) {
    if (url.endsWith(".tsx")) return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText };
    return nextLoad(url, context);
  } });
  try {
    const { DemoFiveDraftRestore } = await import("../components/photographer-guide/demo-five-draft-restore.tsx");
    const html = renderToStaticMarkup(createElement(DemoFiveDraftRestore, { drafts: [draft()], unreadableCount: 1, disabled: false, onRestore() {} }));
    assert.match(html, /role="alert"/);
    assert.match(html, /could not be read/i); assert.match(html, /preserved/i);
    assert.match(html, /Restore 123 Main Street \(10 photos\)/);
  } finally { hook.deregister(); }
});

test("rendered category requires Exterior and limits Interior N/A to optional features", async () => {
  const hook = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith("@/")) {
        const base = new URL(`../${specifier.slice(2)}`, import.meta.url);
        for (const suffix of [".ts", ".tsx"]) if (existsSync(fileURLToPath(base) + suffix)) return { url: base.href + suffix, shortCircuit: true };
      }
      if (specifier.startsWith(".") && context.parentURL?.endsWith(".tsx")) {
        const base = new URL(specifier, context.parentURL);
        if (existsSync(fileURLToPath(base) + ".tsx")) return { url: base.href + ".tsx", shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url.endsWith(".tsx")) return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText };
      return nextLoad(url, context);
    },
  });
  try {
    const { DemoFivePhotoCategory } = await import("../components/photographer-guide/demo-five-photo-category.tsx");
    const props = { category: "exterior", photos: draft().photos.slice(0, 2), notApplicable: [], disabled: false,
      onCapture() {}, onView() {}, onRemove() {}, onNotApplicable() {}, onCancelCapture() {} };
    const html = renderToStaticMarkup(createElement(DemoFivePhotoCategory, props));
    assert.match(html, /2\/4 photos — Needed/);
    assert.equal((html.match(/<li>/g) ?? []).length, 2);
    assert.doesNotMatch(html, /Mark feature N\/A/);
    const interior = renderToStaticMarkup(createElement(DemoFivePhotoCategory, { ...props, category: "interior", photos: [], notApplicable: [{ category: "interior", photoType: "basement" }] }));
    assert.match(interior, /checked=""[^>]*\/>Basement N\/A/);
    assert.match(interior, />Attic N\/A/);
    assert.match(interior, />Garage N\/A/);
    assert.doesNotMatch(interior, /Roof N\/A|Outbuildings N\/A/);
    assert.match(interior, /<details class="demo-five-na-disclosure"><summary>Mark feature N\/A<\/summary>/);
    assert.doesNotMatch(interior, /<details class="demo-five-na-disclosure" open/);
    const mechanical = renderToStaticMarkup(createElement(DemoFivePhotoCategory, { ...props, category: "mechanical", photos: [], notApplicable: [] }));
    assert.doesNotMatch(mechanical, /Mark feature N\/A/);
    assert.match(html, /accept="image\/\*" capture="environment"/);
    assert.match(html, /aria-label="View View 0"/);
    const complete = renderToStaticMarkup(createElement(DemoFivePhotoCategory, { ...props, photos: draft().photos.slice(0, 4) }));
    assert.match(complete, /4\/4 photos — Complete/);
    const removed = renderToStaticMarkup(createElement(DemoFivePhotoCategory, { ...props, photos: [] }));
    assert.match(removed, /0\/4 photos — Needed/);
    const disabled = renderToStaticMarkup(createElement(DemoFivePhotoCategory, { ...props, disabled: true }));
    assert.ok([...disabled.matchAll(/<button\b[^>]*>/g)].every(([button]) => button.includes('disabled=""')), "all category actions, including View, must honor the busy/submission guard");
  } finally { hook.deregister(); }
});
