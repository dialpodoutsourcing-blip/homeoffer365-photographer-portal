"use client";

import { useEffect, useReducer, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { applyAddressLocality, findAddressLocalities, formatAddressLocality, type AddressLocality } from "@/lib/address-suggestions";
import { createIndexedDbPhotoDraftStore, createPhotoDraftKey, PhotoDraftConflictError, type PhotoDraftStore } from "@/lib/demo-five/photo-draft-store";
import { PHOTO_CATEGORIES, validatePhotoMinimums, type DraftPhoto, type PhotoCategory, type PhotoType, type PhotographerDetails } from "@/lib/demo-five/photo-workflow";
import { preparePhoto } from "@/lib/demo-five/prepare-photo";
import { uploadPhotoDraft, uploadToSignedPhotoUrl, type UploadPhotoDraft, type UploadProgress } from "@/lib/demo-five/upload-photo-draft";
import { DemoFivePhotoCategory } from "./demo-five-photo-category";
import { DemoFivePhotoEditor } from "./demo-five-photo-editor";
import { DemoFiveDraftRestore } from "./demo-five-draft-restore";
import { initialPhotoFormState, photoFormReducer } from "@/lib/demo-five/photo-form-state";
import { SubmissionConfirmation } from "./submission-confirmation";

const addressListId = "demo-five-address-suggestions";
function emptyDraft(): UploadPhotoDraft {
  const browserDraftId = crypto.randomUUID();
  return { version: 1, browserDraftId, draftKey: createPhotoDraftKey("", browserDraftId), propertyAddress: "",
    photographer: { name: "", email: "", phone: "", paymentMethod: "", paymentUrl: "" }, photos: [], notApplicable: [], updatedAt: new Date().toISOString() };
}
function storageMessage(error: unknown) {
  if (error instanceof PhotoDraftConflictError) return error.message;
  return error instanceof Error && error.name === "QuotaExceededError"
    ? "Device storage is full. Free some space and save again. This photo has not been added; existing saved photos are preserved."
    : "Could not save on this device. Check browser storage permissions and free space, then try again. Keep this page open to preserve unsaved changes.";
}

export function DemoFiveSubmissionForm({ storageOrigin }: { storageOrigin: string }) {
  const [draft, setDraft] = useState<UploadPhotoDraft | null>(null);
  const current = useRef<UploadPhotoDraft | null>(null);
  const store = useRef<PhotoDraftStore | null>(null);
  const writes = useRef(Promise.resolve());
  const submittingRef = useRef(false);
  const [savedDrafts, setSavedDrafts] = useState<UploadPhotoDraft[]>([]);
  const [unreadableDrafts, setUnreadableDrafts] = useState(0);
  const [attempt, dispatch] = useReducer(photoFormReducer, initialPhotoFormState);
  const { error, busy, submitting, submitted, edit, progress, terminalFailure, editorRevision } = attempt;
  const setError = (error: string) => dispatch({ type: "patch", value: { error } });
  const setBusy = (busy: boolean) => dispatch({ type: "patch", value: { busy } });
  const setSubmitting = (submitting: boolean) => dispatch({ type: "patch", value: { submitting } });
  const setSubmitted = (submitted: boolean) => dispatch({ type: "patch", value: { submitted } });
  const setProgress = (progress: UploadProgress | null) => dispatch({ type: "patch", value: { progress } });
  const setTerminalFailure = (terminalFailure: boolean) => dispatch({ type: "patch", value: { terminalFailure } });
  const [notice, setNotice] = useState("");
  const [online, setOnline] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    store.current = createIndexedDbPhotoDraftStore(window.indexedDB);
    store.current.list().then(({ drafts, unreadableDraftKeys }) => {
      if (!mounted) return;
      setSavedDrafts(drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      setUnreadableDrafts(unreadableDraftKeys.length);
    }).catch(error => { if (mounted) setError(error instanceof Error ? error.message : storageMessage(error)); }).finally(() => {
      if (mounted) { const value = emptyDraft(); current.current = value; setDraft(value); setOnline(navigator.onLine); }
    });
    const connectivity = () => setOnline(navigator.onLine);
    window.addEventListener("online", connectivity); window.addEventListener("offline", connectivity);
    return () => { mounted = false; window.removeEventListener("online", connectivity); window.removeEventListener("offline", connectivity); };
  }, []);

  // Ordered local edits advance from our own last committed revision. The
  // repository compares that revision atomically against other tabs' writes.
  function persist(value: UploadPhotoDraft, previousKey?: string): Promise<void> {
    const snapshot = structuredClone(value);
    const pending = writes.current.catch(() => {}).then(async () => {
      if (!store.current) throw new Error("Local photo storage is not ready.");
      if (current.current?.browserDraftId === snapshot.browserDraftId) snapshot.revision = current.current.revision;
      await store.current.save(snapshot, previousKey);
      value.revision = snapshot.revision;
      if (current.current?.browserDraftId === snapshot.browserDraftId) current.current.revision = snapshot.revision;
    });
    writes.current = pending;
    return pending;
  }
  function display(value: UploadPhotoDraft) { current.current = value; setDraft(value); }
  function updated(value: UploadPhotoDraft): UploadPhotoDraft {
    return { ...value, draftKey: createPhotoDraftKey(value.propertyAddress, value.browserDraftId), updatedAt: new Date().toISOString() };
  }
  function updateFields(change: Partial<UploadPhotoDraft>) {
    const previous = current.current;
    if (!previous || submittingRef.current || previous.upload) return;
    const value = updated({ ...previous, ...change });
    display(value);
    void persist(value, previous.draftKey).then(() => setNotice("Draft saved on this device.")).catch(error => setError(storageMessage(error)));
  }
  function photographerField(field: keyof PhotographerDetails, value: string) {
    if (current.current) updateFields({ photographer: { ...current.current.photographer, [field]: value } });
  }
  async function updatePhotos(photos: DraftPhoto[]) {
    if (!current.current || current.current.upload || submittingRef.current) return;
    const value = updated({ ...current.current, photos });
    await persist(value);
    display(value); setError(""); setNotice("Photo checklist saved on this device.");
  }
  async function capture(file: File, category: PhotoCategory, existing?: DraftPhoto) {
    if (busy || submittingRef.current || current.current?.upload) return;
    const focus = { returnFocus: document.activeElement as HTMLElement | null };
    dispatch({ type: "captureStarted" }); setNotice("Preparing photo…");
    try {
      const image = await preparePhoto(file);
      dispatch({ type: "captureFinished", edit: { image, category, existing, capturedAt: new Date().toISOString(), ...focus } });
      setNotice("");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not open the camera image. Enable camera access or choose an existing image."); }
    finally { setBusy(false); }
  }
  async function savePhoto(photo: DraftPhoto) {
    const previous = current.current;
    if (!previous) return;
    const exists = previous.photos.some(item => item.clientPhotoId === photo.clientPhotoId);
    try {
      await updatePhotos(exists ? previous.photos.map(item => item.clientPhotoId === photo.clientPhotoId ? photo : item) : [...previous.photos, photo]);
      dispatch({ type: "closeEditor" });
    } catch (error) { throw new Error(storageMessage(error)); }
  }
  async function removePhoto(photo: DraftPhoto) {
    if (!current.current || busy) return;
    setBusy(true);
    try { await updatePhotos(current.current.photos.filter(item => item.clientPhotoId !== photo.clientPhotoId)); }
    catch (error) { setError(storageMessage(error)); }
    finally { setBusy(false); }
  }
  async function notApplicable(category: PhotoCategory, photoType: PhotoType, checked: boolean) {
    if (!current.current || busy || current.current.upload || submittingRef.current) return;
    setBusy(true);
    const remaining = current.current.notApplicable.filter(item => item.category !== category || item.photoType !== photoType);
    const value = updated({ ...current.current, notApplicable: checked ? [...remaining, { category, photoType }] : remaining });
    try { await persist(value); display(value); setNotice("N/A selections saved. Photo minimums are unchanged."); }
    catch (error) { setError(storageMessage(error)); }
    finally { setBusy(false); }
  }
  async function restore(value: UploadPhotoDraft) {
    if (busy || submittingRef.current) return;
    setBusy(true);
    try {
      await writes.current;
      const latest = await store.current!.load(value.draftKey);
      if (!latest) throw new PhotoDraftConflictError();
      display(latest); setSavedDrafts([]); dispatch({ type: "draftRestored" }); closeSuggestions(); setNotice("Saved visit restored, including photos and upload progress.");
    }
    catch (error) { setError(storageMessage(error)); }
    finally { setBusy(false); }
  }
  const suggestions = findAddressLocalities(draft?.propertyAddress ?? "", 5);
  function closeSuggestions() { setSuggestionsOpen(false); setActiveSuggestion(-1); }
  function selectLocality(locality: AddressLocality) { updateFields({ propertyAddress: applyAddressLocality(current.current?.propertyAddress ?? "", locality) }); closeSuggestions(); }
  function addressKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { closeSuggestions(); return; }
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setSuggestionsOpen(true); setActiveSuggestion(index => (index + 1) % suggestions.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setSuggestionsOpen(true); setActiveSuggestion(index => index > 0 ? index - 1 : suggestions.length - 1); }
    else if (event.key === "Enter" && suggestionsOpen && activeSuggestion >= 0) { event.preventDefault(); selectLocality(suggestions[activeSuggestion]); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || busy || !current.current) return;
    if (!navigator.onLine) { setError("You are offline. Reconnect to submit; you can keep saving photos on this device."); return; }
    if (!storageOrigin) { setError("Photo upload configuration is unavailable. Please contact Home Offer 365."); return; }
    submittingRef.current = true; dispatch({ type: "submissionStarted" }); closeSuggestions();
    try {
      // Retry the latest in-memory state if an earlier field save hit quota.
      await writes.current.catch(() => persist(current.current!));
      const value = current.current;
      const result = await uploadPhotoDraft(value, fetch, (entry, photo) => uploadToSignedPhotoUrl(storageOrigin, entry, photo), { store: store.current!, onProgress: setProgress });
      display({ ...value });
      if (!result.ok) {
        setError(result.error);
        setTerminalFailure(["SESSION_EXPIRED", "SESSION_FAILED", "OBJECT_MISMATCH", "FINALIZE_REJECTED", "SESSION_NOT_FOUND"].includes(result.code ?? ""));
        return;
      }
      await writes.current;
      await store.current!.delete(value.draftKey);
      setSavedDrafts(items => items.filter(item => item.draftKey !== value.draftKey));
      display(emptyDraft()); setNotice(""); dispatch({ type: "submissionSucceeded" });
    } catch (error) { setError(storageMessage(error)); }
    finally { submittingRef.current = false; setSubmitting(false); }
  }
  async function restartExpired() {
    if (!current.current || !terminalFailure) return;
    setBusy(true);
    const value = { ...current.current, upload: undefined };
    try { await persist(value); display(value); setTerminalFailure(false); setProgress(null); setError(""); setNotice("The expired submission was reset. All local photos are ready to submit again."); }
    catch (error) { setError(storageMessage(error)); }
    finally { setBusy(false); }
  }
  const locked = !!draft?.upload;
  const disabled = !draft || busy || submitting || locked;
  const minimums = validatePhotoMinimums(draft?.photos ?? []);

  return <section id="submit-photos" className="demo-five-photo-form" aria-labelledby="demo-five-submit-title">
    <header><h2 id="demo-five-submit-title">Your property photo checklist</h2><p>Save your visit on this device, then submit all your photos together.</p><p>Minimums: 4 Exterior · 4 Interior · 1 Mechanical · 1 Condition. N/A selections do not replace photos.</p></header>
    <DemoFiveDraftRestore drafts={savedDrafts} unreadableCount={unreadableDrafts} disabled={submitting || busy} onRestore={value => void restore(value)} />
    <form onSubmit={submit}>
      <fieldset disabled={disabled} className="demo-five-details">
        <legend>Photographer and property details</legend>
        <div className="demo-five-fields">
          <label>Photographer&apos;s Name<input ref={nameInput} type="text" name="photographerName" autoComplete="name" maxLength={200} required value={draft?.photographer.name ?? ""} onChange={event => photographerField("name", event.target.value)} /></label>
          <label>Email<input type="email" name="email" autoComplete="email" maxLength={320} required value={draft?.photographer.email ?? ""} onChange={event => photographerField("email", event.target.value)} /></label>
          <label>Phone<input type="tel" name="phone" autoComplete="tel" maxLength={50} required value={draft?.photographer.phone ?? ""} onChange={event => photographerField("phone", event.target.value)} /></label>
          <div className="demo-five-address"><label htmlFor="demo-five-address">Property Address</label><input id="demo-five-address" type="text" name="propertyAddress" autoComplete="street-address" maxLength={500} required role="combobox" aria-autocomplete="list" aria-expanded={suggestionsOpen && suggestions.length > 0} aria-controls={addressListId} aria-activedescendant={suggestionsOpen && activeSuggestion >= 0 ? `${addressListId}-${activeSuggestion}` : undefined} value={draft?.propertyAddress ?? ""} onChange={event => { updateFields({ propertyAddress: event.target.value }); setSuggestionsOpen(true); setActiveSuggestion(-1); }} onFocus={() => setSuggestionsOpen(true)} onBlur={closeSuggestions} onKeyDown={addressKey} />
            <small>Suggested service areas in Pennsylvania</small>
            {suggestionsOpen && suggestions.length > 0 && <div id={addressListId} className="demo-five-address-options" role="listbox" aria-label="Pennsylvania service areas">{suggestions.map((locality, index) => <button type="button" id={`${addressListId}-${index}`} key={`${locality.city}-${locality.zip}`} role="option" aria-selected={activeSuggestion === index} tabIndex={-1} onPointerDown={event => { event.preventDefault(); selectLocality(locality); }} onClick={() => selectLocality(locality)}>{formatAddressLocality(locality)}</button>)}</div>}
          </div>
          <label>Payment Method<input type="text" name="paymentMethod" maxLength={100} required value={draft?.photographer.paymentMethod ?? ""} onChange={event => photographerField("paymentMethod", event.target.value)} placeholder="Your preferred payment method" /></label>
          <label>Payment URL<input type="url" name="paymentUrl" inputMode="url" maxLength={2048} required pattern="https://.*" value={draft?.photographer.paymentUrl ?? ""} onChange={event => photographerField("paymentUrl", event.target.value)} placeholder="https://…" /></label>
        </div>
      </fieldset>
      <div className="demo-five-categories">{PHOTO_CATEGORIES.map(category => <DemoFivePhotoCategory key={category} category={category} photos={draft?.photos.filter(photo => photo.category === category) ?? []} notApplicable={draft?.notApplicable ?? []} disabled={disabled} onCapture={(file, category, existing) => void capture(file, category, existing)} onView={photo => dispatch({ type: "openEditor", edit: { image: photo, category: photo.category, existing: photo, capturedAt: photo.capturedAt, viewOnly: true } })} onRemove={photo => void removePhoto(photo)} onNotApplicable={(category, type, checked) => void notApplicable(category, type, checked)} onCancelCapture={() => setNotice("No photo was added. If camera access was denied, enable it in browser settings or choose an existing image.")} />)}</div>
      {locked && <p>This visit is saved for submission. Retry to finish uploading the remaining photos.</p>}
      {!online && <p role="status">You are offline. Keep taking and saving photos; reconnect before submitting.</p>}
      {progress && <div className="demo-five-progress" role="status" aria-live="polite"><progress value={progress.completed} max={progress.total} aria-label="Photos uploaded" /><p>{progress.phase === "preparing" ? "Preparing secure upload" : progress.phase === "finalizing" ? "Confirming your submission" : "Uploading photos"}: {progress.completed}/{progress.total} {progress.currentPhotoName}</p></div>}
      <p className="demo-five-notice" role="status" aria-live="polite">{notice || (!draft ? "Loading saved visits…" : "Photos stay on this device until you submit.")}</p>
      {error && <p className="demo-five-error" role="alert">{error}</p>}
      {terminalFailure && <button type="button" disabled={busy || submitting} onClick={() => void restartExpired()}>Reset expired submission and keep photos</button>}
      <div className="demo-five-submit"><small>{minimums.ok ? "All photo minimums met. Review your details, then submit." : minimums.error}</small><button type="submit" disabled={!draft || busy || submitting || !online || !minimums.ok || terminalFailure}>{submitting ? "Submitting…" : locked ? "Retry submission" : "Submit Photos"}</button></div>
    </form>
    {edit && <DemoFivePhotoEditor key={editorRevision} edit={edit} onSave={savePhoto} onClose={() => dispatch({ type: "closeEditor" })} />}
    {submitted && <SubmissionConfirmation onClose={() => { setSubmitted(false); requestAnimationFrame(() => nameInput.current?.focus()); }} />}
  </section>;
}
