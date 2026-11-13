import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import React, { createElement } from "react";
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

function componentImports() {
  return registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "next/image") return { url: new URL("../node_modules/next/image.js", import.meta.url).href, shortCircuit: true };
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
}

// Exercise the real form handlers and render its real children without adding a DOM
// dependency. Only browser APIs and the root component's hook scheduler are hosted here.
async function mountedForm(saved) {
  const hook = componentImports();
  const { DemoFiveSubmissionForm } = await import("../components/photographer-guide/demo-five-submission-form.tsx");
  const factory = new IDBFactory();
  const store = createIndexedDbPhotoDraftStore(factory);
  if (saved) await store.save(saved);
  const original = { window: globalThis.window, document: globalThis.document, createImageBitmap: globalThis.createImageBitmap };
  const document = { activeElement: null, createElement: () => ({ getContext: () => ({ drawImage() {} }), toBlob: callback => callback(new Blob(["image"], { type: "image/webp" })) }) };
  globalThis.document = document;
  globalThis.window = { indexedDB: factory, addEventListener() {}, removeEventListener() {} };
  globalThis.createImageBitmap = async () => ({ width: 100, height: 80, close() {} });
  const slots = [], effects = [], cleanups = [];
  let index = 0, tree;
  const dispatcher = {
    useState(initial) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = typeof initial === "function" ? initial() : initial;
      return [slots[slot], value => { slots[slot] = typeof value === "function" ? value(slots[slot]) : value; }];
    },
    useReducer(reducer, initial) {
      const [value, set] = dispatcher.useState(initial);
      return [value, action => set(previous => reducer(previous, action))];
    },
    useRef(initial) { const [value] = dispatcher.useState(() => ({ current: initial })); return value; },
    useEffect(effect, dependencies) {
      const slot = index++;
      if (!slots[slot] || dependencies.some((value, i) => value !== slots[slot][i])) {
        slots[slot] = dependencies; effects.push(() => { cleanups[slot]?.(); cleanups[slot] = effect(); });
      }
    },
  };
  function elements(node = tree) {
    if (!node || typeof node !== "object") return [];
    return [node, ...React.Children.toArray(node.props?.children).flatMap(child => elements(child))];
  }
  function render() {
    index = 0;
    const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const previous = internals.H;
    internals.H = dispatcher;
    try { tree = DemoFiveSubmissionForm({ storageOrigin: "https://storage.example.com" }); }
    finally { internals.H = previous; }
    for (const element of elements()) {
      if (typeof element.type !== "string" || !element.props.ref || element.props.ref.current) continue;
      const listeners = new Map();
      element.props.ref.current = { listeners, focus() { document.activeElement = this; }, click() {}, addEventListener(name, action) { listeners.set(name, action); }, removeEventListener(name) { listeners.delete(name); } };
    }
    effects.splice(0).forEach(effect => effect());
    return renderToStaticMarkup(tree);
  }
  async function settle() { for (let i = 0; i < 5; i++) await new Promise(resolve => setTimeout(resolve, 0)); return render(); }
  function find(predicate) { const result = elements().find(predicate); assert.ok(result, "expected rendered control"); return result; }
  const api = { render, settle, find, elements, html: () => renderToStaticMarkup(tree),
    loadSaved: key => store.load(key),
    field(name, value) { find(node => node.props?.name === name).props.onChange({ target: { value } }); render(); },
    async next() { await find(node => node.type === "form").props.onSubmit({ preventDefault() {} }); return settle(); },
    async restore() { await find(node => node.type?.name === "DemoFiveDraftRestore").props.onRestore(saved); return settle(); },
    close() { cleanups.forEach(cleanup => cleanup?.()); Object.assign(globalThis, original); hook.deregister(); },
  };
  render();
  for (let i = 0; i < 40; i++) {
    await settle();
    if (!api.html().includes("Loading saved visits")) break;
  }
  return api;
}

test("wizard validates each visible step and preserves contact and payment values on Back", async () => {
  const form = await mountedForm();
  try {
    let html = form.html();
    assert.match(html, /Step 1 of 3/);
    for (const name of ["photographerName", "email", "phone"]) assert.match(html, new RegExp(`name="${name}"`));
    assert.doesNotMatch(html, /name="paymentMethod"|name="paymentUrl"|name="propertyAddress"|type="file"/);
    assert.match(html, />Next<\/button>/);
    await form.next(); assert.match(form.html(), /role="alert"/); assert.match(form.html(), /Step 1 of 3/);
    form.field("photographerName", "Ada"); form.field("email", "ada@example.com"); form.field("phone", "555-555-5555");
    html = await form.next(); assert.match(html, /Step 2 of 3/);
    assert.match(html, /name="paymentMethod"/); assert.match(html, /name="paymentUrl"/);
    assert.doesNotMatch(html, /name="photographerName"|name="email"|name="phone"|name="propertyAddress"|type="file"/);
    assert.match(html, />Back<\/button>/); assert.match(html, />Next<\/button>/);
    await form.next(); assert.match(form.html(), /Step 2 of 3/); assert.match(form.html(), /role="alert"/);
    form.field("paymentMethod", "Invoice"); form.field("paymentUrl", "https://example.com/pay");
    html = await form.next(); assert.match(html, /Step 3 of 3/);
    assert.match(html, /name="propertyAddress"/); assert.match(html, /Take all photos horizontally \(landscape orientation\)/);
    assert.equal((html.match(/type="file"/g) ?? []).length, 2);
    assert.equal((html.match(/capture="environment"/g) ?? []).length, 1);
    assert.match(html, />Take Photo<\/button>/); assert.match(html, />Upload Image<\/button>/);
    form.find(node => node.type === "button" && node.props.children === "Back").props.onClick(); form.render();
    assert.match(form.html(), /value="Invoice"/);
    form.find(node => node.type === "button" && node.props.children === "Back").props.onClick(); form.render();
    assert.match(form.html(), /value="Ada"/); assert.match(form.html(), /value="ada@example.com"/);
  } finally { form.close(); }
});

test("restored photos open Step 3 with five counted tabs, and only Interior exposes N/A", async () => {
  const saved = draft();
  const original = saved.photos[0];
  const originalMetadata = { ...original };
  const originalBlobBytes = await original.blob.arrayBuffer();
  const form = await mountedForm(saved);
  try {
    await form.restore(); const html = form.html();
    assert.match(html, /Step 3 of 3/);
    for (const [label, count] of [["Exterior", 4], ["Interior", 4], ["Mechanical", 1], ["Condition", 1], ["Other", 0]]) {
      assert.match(html, new RegExp(`role="tab"[^>]*aria-label="${label}, ${count} photos"`));
    }
    assert.doesNotMatch(html, /Mark feature N\/A/);
    const tab = label => form.find(node => node.props?.role === "tab" && node.props["aria-label"].startsWith(label));
    tab("Interior").props.onClick(); form.render();
    assert.match(form.html(), /Basement N\/A/); assert.match(form.html(), /Attic N\/A/); assert.match(form.html(), /Garage N\/A/);
    tab("Other").props.onClick(); form.render();
    assert.match(form.html(), /No Other photos yet/); assert.doesNotMatch(form.html(), /Mark feature N\/A/);
    tab("Interior").props.onClick(); form.render();
    const photo = { ...draft().photos[0], clientPhotoId: "photo-new", category: "other", photoName: "Garden detail" };
    // The editor's saved classification determines the newly active tab.
    const camera = form.find(node => node.type === "input" && node.props.capture === "environment");
    const trigger = form.find(node => node.type === "button" && node.props.children === "Take Photo");
    trigger.props.onClick({ currentTarget: trigger.props.ref?.current ?? { focus() {} } });
    await camera.props.onChange({ currentTarget: { files: [new File(["image"], "photo.jpg", { type: "image/jpeg" })], value: "photo.jpg" } });
    await form.settle();
    let editor = form.find(node => node.type?.name === "DemoFivePhotoEditor");
    assert.equal(editor.props.edit.category, ""); assert.equal(editor.props.edit.existing, undefined);
    await editor.props.onSave(photo); await form.settle();
    assert.match(form.html(), /aria-selected="true"[^>]*aria-label="Other, 1 photos"/);
    assert.match(form.html(), /Garden detail/);
    const displayedTotal = [...form.html().matchAll(/aria-label="(?:Exterior|Interior|Mechanical|Condition|Other), (\d+) photos"/g)]
      .reduce((total, match) => total + Number(match[1]), 0);
    assert.equal(displayedTotal, 11);
    assert.equal(saved.photos.length, 10);
    const persisted = await form.loadSaved(saved.draftKey);
    assert.equal(persisted.photos.length, 11);
    assert.deepEqual(persisted.photos[0], originalMetadata);
    assert.deepEqual(await persisted.photos[0].blob.arrayBuffer(), originalBlobBytes);
  } finally { form.close(); }
});

test("shared retake cancellation restores focus and keeps the saved photo", async () => {
  const saved = draft(), form = await mountedForm(saved);
  try {
    await form.restore();
    const panel = form.find(node => node.type?.name === "DemoFivePhotoCategory");
    let focused = 0; const trigger = { focus() { focused++; } };
    panel.props.onRetake(saved.photos[0], trigger);
    const camera = form.find(node => node.type === "input" && node.props.capture === "environment");
    camera.props.ref.current.listeners.get("cancel")(); await form.settle();
    assert.equal(focused, 1); assert.match(form.html(), /No photo was added/);
    assert.match(form.html(), /View 0/); assert.equal(form.elements().some(node => node.type?.name === "DemoFivePhotoEditor"), false);
    panel.props.onRetake(saved.photos[0], trigger);
    await camera.props.onChange({ currentTarget: { files: [new File(["image"], "retake.jpg", { type: "image/jpeg" })], value: "retake.jpg" } });
    await form.settle();
    const editor = form.find(node => node.type?.name === "DemoFivePhotoEditor");
    assert.equal(editor.props.edit.category, "exterior"); assert.equal(editor.props.edit.existing.clientPhotoId, "photo-0");
  } finally { form.close(); }
});

test("restored incomplete details explain disabled submission and recover through the required step", async () => {
  const onlineDescriptor = Object.getOwnPropertyDescriptor(navigator, "onLine");
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  try {
    for (const missing of ["contact-and-payment", "payment"]) {
      const saved = draft();
      saved.photographer.paymentUrl = "";
      if (missing === "contact-and-payment") saved.photographer.email = "";
      const form = await mountedForm(saved);
      try {
        await form.restore();
        assert.match(form.html(), /Step 3 of 3/);
        const submit = () => form.find(node => node.type === "button" && node.props.type === "submit");
        assert.equal(submit().props.disabled, true, "incomplete details must retain submission gating");
        assert.match(form.html(), missing === "contact-and-payment" ? /Enter your name, a valid email, and phone number/ : /Enter a payment method and payment URL/);
        assert.doesNotMatch(form.html(), /All photo minimums met\. Review your details, then submit\./);
        const label = missing === "contact-and-payment" ? "Complete User Information" : "Complete Payment Information";
        form.find(node => node.type === "button" && node.props.children === label).props.onClick();
        form.render();
        if (missing === "contact-and-payment") {
          assert.match(form.html(), /Step 1 of 3/);
          form.field("email", "ada@example.com");
          await form.next();
        }
        assert.match(form.html(), /Step 2 of 3/);
        form.field("paymentUrl", "https://example.com/pay");
        await form.next();
        assert.match(form.html(), /Step 3 of 3/);
        assert.equal(submit().props.disabled, false, "correcting details should unblock the valid saved photo set");
        assert.match(form.html(), /View 0/); assert.match(form.html(), /value="123 Main Street"/);
        assert.doesNotMatch(form.html(), /Complete User Information|Complete Payment Information/);
      } finally { form.close(); }
    }
  } finally {
    if (onlineDescriptor) Object.defineProperty(navigator, "onLine", onlineDescriptor);
    else delete navigator.onLine;
  }
});

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

test("wizard validates contact fields independently with existing text and email limits", async () => {
  const { validateWizardStep } = await formState();
  assert.equal(typeof validateWizardStep, "function");
  const d = { ...draft(), propertyAddress: "", photos: [] };
  d.photographer = { ...d.photographer, paymentMethod: "", paymentUrl: "" };
  assert.equal(validateWizardStep(1, d).ok, true);
  for (const [field, boundary] of [
    ["name", "a".repeat(200)], ["email", `${"a".repeat(308)}@example.com`], ["phone", "1".repeat(50)],
  ]) {
    assert.equal(validateWizardStep(1, { ...d, photographer: { ...d.photographer, [field]: boundary } }).ok, true, field);
    for (const value of [" ", `${boundary}a`]) assert.equal(validateWizardStep(1, { ...d, photographer: { ...d.photographer, [field]: value } }).ok, false, field);
  }
  for (const email of ["ada", "ada@example", "a b@example.com", "a@@example.com", `${"\u0130".repeat(308)}@example.com`]) {
    assert.equal(validateWizardStep(1, { ...d, photographer: { ...d.photographer, email } }).ok, false);
  }
});

test("wizard validates only payment fields in Step 2 using HTTPS without credentials", async () => {
  const { validateWizardStep } = await formState();
  assert.equal(typeof validateWizardStep, "function");
  const d = draft(); d.photographer = { ...d.photographer, name: "", email: "", phone: "" };
  assert.equal(validateWizardStep(2, { ...d, propertyAddress: "", photos: [] }).ok, true);
  for (const [field, boundary] of [["paymentMethod", "a".repeat(100)], ["paymentUrl", `https://example.com/${"a".repeat(2028)}`]]) {
    assert.equal(validateWizardStep(2, { ...d, photographer: { ...d.photographer, [field]: boundary } }).ok, true);
    for (const value of [" ", `${boundary}a`]) assert.equal(validateWizardStep(2, { ...d, photographer: { ...d.photographer, [field]: value } }).ok, false);
  }
  for (const paymentUrl of ["http://example.com", "javascript:alert(1)", "https://", "https://user:secret@example.com", "/pay"]) {
    assert.equal(validateWizardStep(2, { ...d, photographer: { ...d.photographer, paymentUrl } }).ok, false);
  }
});

test("wizard Step 3 requires an address within its existing limit", async () => {
  const { validateWizardStep } = await formState();
  assert.equal(typeof validateWizardStep, "function");
  const d = draft();
  assert.equal(validateWizardStep(3, { ...d, propertyAddress: "a".repeat(500) }).ok, true);
  for (const propertyAddress of ["", " ", "a".repeat(501)]) assert.equal(validateWizardStep(3, { ...d, propertyAddress }).ok, false);
});

test("draft restoration prioritizes property work then the earliest incomplete wizard step", async () => {
  const { wizardStepForDraft } = await formState();
  assert.equal(typeof wizardStepForDraft, "function");
  const d = { ...draft(), propertyAddress: "", photos: [] };
  const empty = { name: "", email: "", phone: "", paymentMethod: "", paymentUrl: "" };
  assert.equal(wizardStepForDraft({ ...d, photographer: empty }), 1);
  assert.equal(wizardStepForDraft({ ...d, photographer: { ...d.photographer, email: "invalid" } }), 1);
  assert.equal(wizardStepForDraft({ ...d, photographer: { ...d.photographer, paymentUrl: "" } }), 2);
  assert.equal(wizardStepForDraft(d), 3);
  assert.equal(wizardStepForDraft({ ...d, propertyAddress: " ", photographer: empty }), 1);
  assert.equal(wizardStepForDraft({ ...d, propertyAddress: "123 Main Street", photographer: empty }), 3);
  assert.equal(wizardStepForDraft({ ...d, photos: draft().photos.slice(0, 1), photographer: empty }), 3);
});

test("editor category changes clear incompatible photo types and preserve shared Other type", async () => {
  const { photoClassificationReducer } = await formState();
  assert.equal(typeof photoClassificationReducer, "function");
  const initial = { category: "exterior", photoType: "front" };
  const interior = photoClassificationReducer(initial, { type: "category", category: "interior" });
  assert.deepEqual(interior, { category: "interior", photoType: "" });
  assert.deepEqual(initial, { category: "exterior", photoType: "front" }, "the saved classification must not mutate");
  const kitchen = photoClassificationReducer(interior, { type: "photoType", photoType: "kitchen" });
  assert.deepEqual(kitchen, { category: "interior", photoType: "kitchen" });
  assert.deepEqual(photoClassificationReducer(kitchen, { type: "category", category: "interior" }), kitchen);
  assert.deepEqual(photoClassificationReducer(kitchen, { type: "category", category: "other" }), { category: "other", photoType: "" });
  assert.deepEqual(photoClassificationReducer({ category: "exterior", photoType: "other" }, { type: "category", category: "other" }), { category: "other", photoType: "other" });
  assert.deepEqual(photoClassificationReducer(kitchen, { type: "category", category: "" }), { category: "", photoType: "" });
});

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
  const [form, category, editor] = await Promise.all([read("demo-five-submission-form"), read("demo-five-photo-category"), read("demo-five-photo-editor")]);
  assert.ok(form, "Demo Five form must exist");
  assert.doesNotMatch(form, /Google Drive|driveLink/);
  for (const name of ["photographerName", "email", "phone", "paymentMethod", "paymentUrl", "propertyAddress"]) assert.ok(form.includes(`name="${name}"`));
  for (const helper of ["findAddressLocalities", "applyAddressLocality", "formatAddressLocality", "createIndexedDbPhotoDraftStore", "validatePhotoMinimums", "SubmissionConfirmation"]) assert.ok(form.includes(helper));
  assert.match(form, /4 Exterior.*4 Interior.*1 Mechanical.*1 Condition/);
  assert.doesNotMatch(category, /demo-five-type-hint|getPhotoTypeOptions/);
  assert.match(category, /OPTIONAL_FEATURES\[category\]\.length\s*>\s*0/);
  assert.match(category, /<details className="demo-five-na-disclosure">/);
  assert.match(category, /<summary>Mark feature N\/A<\/summary>/);
  for (const action of ["View", "Retake", "Remove", "N\/A"]) assert.match(category, new RegExp(action));
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
      if (specifier === "next/image") return { url: new URL("../node_modules/next/image.js", import.meta.url).href, shortCircuit: true };
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
    const { DemoFivePhotoEditor, photoLabel } = await import("../components/photographer-guide/demo-five-photo-editor.tsx");
    const { DemoFiveSubmissionForm } = await import("../components/photographer-guide/demo-five-submission-form.tsx");
    const formHtml = renderToStaticMarkup(createElement(DemoFiveSubmissionForm, { storageOrigin: "https://storage.example.com" }));
    assert.match(formHtml, /Step 1 of 3/);
    assert.deepEqual([
      photoLabel("front"), photoLabel("exterior_ac_condenser"), photoLabel("roof_soffit_and_gutters"),
      photoLabel("hallway_room_layout"), photoLabel("kitchen_under_sink_plumbing"), photoLabel("basement_window_and_egress"),
      photoLabel("furnace_and_ductwork"), photoLabel("hvac_service_connections"),
    ], [
      "Front exterior", "Exterior AC condenser", "Roof, soffit, and gutters",
      "Hallway and room layout", "Kitchen under-sink plumbing", "Basement window and egress",
      "Furnace and ductwork", "HVAC service connections",
    ]);
    const inaccessiblePhoto = { ...draft().photos[4], photoName: "Blocked basement access", conditionStatus: "not_accessible" };
    const editorHtml = renderToStaticMarkup(createElement(DemoFivePhotoEditor, {
      edit: { image: inaccessiblePhoto, category: "interior", existing: inaccessiblePhoto, capturedAt: inaccessiblePhoto.capturedAt, viewOnly: false },
      async onSave() {}, onClose() {},
    }));
    for (const label of ["Good Condition", "Satisfactory", "Needs Maintenance", "Damaged", "Non-Functional / Unusable", "Not Accessible"]) assert.match(editorHtml, new RegExp(`>${label}<`));
    assert.match(editorHtml, /The area or item could not be reached or its condition could not be confirmed\./);
    assert.match(editorHtml, /Explain why the area or item was not accessible in Description\./);
    const renderEditor = edit => renderToStaticMarkup(createElement(DemoFivePhotoEditor, { edit, async onSave() {}, onClose() {} }));
    const newEdit = { image: draft().photos[0], category: "", capturedAt: draft().photos[0].capturedAt };
    const unclassified = renderEditor(newEdit);
    const categorySelect = unclassified.match(/<select name="category"[^>]*>(.*?)<\/select>/s)?.[1];
    assert.ok(categorySelect, "new captures must show category selection after capture");
    assert.ok(unclassified.indexOf('name="category"') < unclassified.indexOf('name="photoType"'));
    assert.match(unclassified, /<select name="category" required=""/);
    assert.match(categorySelect, /<option value="" selected="">Choose a category<\/option>/);
    for (const label of ["Exterior", "Interior", "Mechanical", "Condition", "Other"]) assert.match(categorySelect, new RegExp(`>${label}<`));
    assert.equal((categorySelect.match(/<option\b/g) ?? []).length, 6);
    assert.equal((unclassified.match(/<select name="photoType"[^>]*>(.*?)<\/select>/s)[1].match(/<option\b/g) ?? []).length, 1);
    for (const [category, expectedType, unexpectedType] of [["exterior", "front", "kitchen"], ["interior", "kitchen", "front"], ["mechanical", "water_heater", "front"], ["condition", "general_condition", "front"], ["other", "other", "front"]]) {
      const html = renderEditor({ ...newEdit, category });
      const types = html.match(/<select name="photoType"[^>]*>(.*?)<\/select>/s)[1];
      assert.match(types, new RegExp(`value="${expectedType}"`));
      assert.doesNotMatch(types, new RegExp(`value="${unexpectedType}"`));
    }
    const existing = { ...draft().photos[4], photoType: "kitchen" };
    const retake = renderEditor({ ...newEdit, category: "", existing });
    assert.match(retake, /<option value="interior" selected="">Interior<\/option>/);
    assert.match(retake, /<option value="kitchen" selected="">Kitchen<\/option>/);
    const props = { category: "exterior", photos: draft().photos.slice(0, 2), notApplicable: [], disabled: false,
      onRetake() {}, onView() {}, onRemove() {}, onNotApplicable() {} };
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
    assert.doesNotMatch(html, /type="file"|Take Photo|Upload Image/);
    assert.match(html, /aria-label="View View 0"/);
    const complete = renderToStaticMarkup(createElement(DemoFivePhotoCategory, { ...props, photos: draft().photos.slice(0, 4) }));
    assert.match(complete, /4\/4 photos — Complete/);
    const removed = renderToStaticMarkup(createElement(DemoFivePhotoCategory, { ...props, photos: [] }));
    assert.match(removed, /0\/4 photos — Needed/);
    const disabled = renderToStaticMarkup(createElement(DemoFivePhotoCategory, { ...props, disabled: true }));
    assert.ok([...disabled.matchAll(/<button\b[^>]*>/g)].every(([button]) => button.includes('disabled=""')), "all category actions, including View, must honor the busy/submission guard");
  } finally { hook.deregister(); }
});
