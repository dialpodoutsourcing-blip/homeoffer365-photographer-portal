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

test("uploads at concurrency three, persists completed IDs, and only confirms after finalize", async () => {
  const { uploadPhotoDraft } = await subject();
  const d = draft(), api = server(d), progress = [], store = createIndexedDbPhotoDraftStore(new IDBFactory());
  let active = 0, maximum = 0;
  const result = await uploadPhotoDraft(d, api.fetch, async (entry, photo) => {
    assert.equal(photo.blob.size, 5); assert.ok(entry.signedToken);
    active++; maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 3)); active--;
  }, { save: value => store.save(value), onProgress: value => progress.push(value), isOnline: () => true });
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
  const first = await uploadPhotoDraft(d, api.fetch, async entry => {
    attempts.push(entry.clientPhotoId); if (entry.clientPhotoId === "photo-2") throw new Error("Connection interrupted");
  }, { save: value => store.save(value) });
  assert.equal(first.ok, false); assert.equal(api.calls.length, 1);
  const restored = await store.load(d.draftKey);
  assert.equal(restored.photos.length, 10); assert.equal(restored.upload.completedPhotoIds.length, 9);
  const second = await uploadPhotoDraft(restored, api.fetch, async entry => attempts.push(entry.clientPhotoId), { save: value => store.save(value) });
  assert.equal(second.ok, true); assert.equal(attempts.length, 11); assert.equal(attempts.at(-1), "photo-2");
  assert.equal(api.calls.filter(c => c.url.endsWith("prepare")).length, 1);
});

test("offline, invalid minimums, and local quota failures make no remote requests", async () => {
  const { uploadPhotoDraft } = await subject();
  for (const kind of ["offline", "minimums", "quota"]) {
    const d = draft(); if (kind === "minimums") d.photos.pop();
    const api = server(d);
    const result = await uploadPhotoDraft(d, api.fetch, async () => assert.fail("must not upload"), {
      isOnline: () => kind !== "offline", save: async () => { if (kind === "quota") throw new DOMException("Full", "QuotaExceededError"); },
    });
    assert.equal(result.ok, false); assert.equal(api.calls.length, 0); assert.ok(d.photos.length >= 9);
  }
});

test("double submit shares one operation and finalized retries skip every uploaded object", async () => {
  const { uploadPhotoDraft } = await subject();
  const d = draft(), api = server(d, { alreadyUploaded: d.photos.map(p => p.clientPhotoId) });
  const upload = async () => assert.fail("already uploaded objects must be skipped");
  const [first, second] = await Promise.all([uploadPhotoDraft(d, api.fetch, upload), uploadPhotoDraft(d, api.fetch, upload)]);
  assert.equal(first.ok, true); assert.equal(second.ok, true); assert.equal(api.calls.length, 2);
});

test("finalize failure preserves retry state and does not report complete", async () => {
  const { uploadPhotoDraft } = await subject();
  const d = draft(), api = server(d, { finalizeFails: true }), progress = [];
  const result = await uploadPhotoDraft(d, api.fetch, async () => {}, { onProgress: p => progress.push(p) });
  assert.equal(result.ok, false); assert.equal(result.code, "RETRYABLE_FAILURE");
  assert.equal(d.photos.length, 10); assert.equal(d.upload.completedPhotoIds.length, 10);
  assert.equal(progress.some(p => p.phase === "complete"), false);
});

test("missing objects at finalize reconcile server state before retrying missing uploads", async () => {
  const { uploadPhotoDraft } = await subject();
  const d = draft(), api = server(d), attempts = [];
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
  assert.equal((await uploadPhotoDraft(d, fetch, upload)).ok, false);
  assert.equal((await uploadPhotoDraft(d, fetch, upload)).ok, true);
  assert.equal(attempts.length, 11); assert.equal(attempts.at(-1), "photo-2");
});

test("lost upload responses reconcile existing objects without overwriting them", async () => {
  const { uploadPhotoDraft } = await subject();
  const d = draft(), api = server(d), attempts = [];
  const first = await uploadPhotoDraft(d, api.fetch, async entry => {
    attempts.push(entry.clientPhotoId);
    if (entry.clientPhotoId === "photo-2") throw Object.assign(new Error("Already exists"), { code: "RECONCILE_UPLOAD" });
  });
  assert.equal(first.ok, false);
  const retry = server(d, { alreadyUploaded: d.photos.map(p => p.clientPhotoId) });
  assert.equal((await uploadPhotoDraft(d, retry.fetch, async () => assert.fail("must not overwrite"))).ok, true);
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
  const [form, category, editor] = await Promise.all([read("demo-five-submission-form"), read("demo-five-photo-category"), read("demo-five-photo-editor")]);
  assert.ok(form, "Demo Five form must exist");
  assert.doesNotMatch(form, /Google Drive|driveLink/);
  for (const name of ["photographerName", "email", "phone", "paymentMethod", "paymentUrl", "propertyAddress"]) assert.ok(form.includes(`name="${name}"`));
  for (const helper of ["findAddressLocalities", "applyAddressLocality", "formatAddressLocality", "createIndexedDbPhotoDraftStore", "validatePhotoMinimums", "SubmissionConfirmation"]) assert.ok(form.includes(helper));
  assert.match(form, /4 Exterior.*4 Interior.*1 Mechanical.*1 Condition/);
  assert.match(category, /accept="image\/\*" capture="environment"/);
  assert.match(category, /addEventListener\("cancel"/);
  assert.match(category, /Choose (?:an )?image/);
  for (const action of ["Take Photo", "View", "Retake", "Remove", "N\/A"]) assert.match(category, new RegExp(action));
  assert.match(editor, /role="dialog"/); assert.match(editor, /aria-modal="true"/);
  assert.match(editor, /Photo name/); assert.match(editor, /Photo type/); assert.match(editor, /Condition status/); assert.match(editor, /Description/);
  assert.match(editor, /\.focus\(/); assert.match(editor, /validateDraftPhoto/);
  assert.match(form, /returnFocus: document\.activeElement/);
  assert.match(editor, /edit\.returnFocus/);
});

test("rendered category counts real photos, supports repeated types, and keeps N/A separate", async () => {
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
    const props = { category: "exterior", photos: draft().photos.slice(0, 2), notApplicable: [{ category: "exterior", photoType: "roof" }], disabled: false,
      onCapture() {}, onView() {}, onRemove() {}, onNotApplicable() {}, onCancelCapture() {} };
    const html = renderToStaticMarkup(createElement(DemoFivePhotoCategory, props));
    assert.match(html, /2\/4 photos — Needed/);
    assert.equal((html.match(/<li>/g) ?? []).length, 2);
    assert.match(html, /checked=""[^>]*\/>Roof N\/A/);
    assert.match(html, /accept="image\/\*" capture="environment"/);
    assert.match(html, /aria-label="View View 0"/);
    const complete = renderToStaticMarkup(createElement(DemoFivePhotoCategory, { ...props, photos: draft().photos.slice(0, 4) }));
    assert.match(complete, /4\/4 photos — Complete/);
    const removed = renderToStaticMarkup(createElement(DemoFivePhotoCategory, { ...props, photos: [] }));
    assert.match(removed, /0\/4 photos — Needed/);
  } finally { hook.deregister(); }
});
