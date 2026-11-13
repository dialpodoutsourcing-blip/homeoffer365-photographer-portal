"use client";

import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import { CONDITION_STATUSES, CONDITION_STATUS_DETAILS, PHOTO_CATEGORIES, getPhotoTypeLabel, getPhotoTypeOptions, validateDraftPhoto, type DraftPhoto, type PhotoCategory, type PhotoType, type ConditionStatus } from "@/lib/demo-five/photo-workflow";
import { photoClassificationReducer, type PhotoEdit } from "@/lib/demo-five/photo-form-state";

export function photoLabel(value: string) {
  return getPhotoTypeLabel(value);
}

export function conditionLabel(value: ConditionStatus) {
  return CONDITION_STATUS_DETAILS[value].label;
}

export function DraftPhotoPreview({ blob, name }: { blob: Blob; name: string }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  // Local Blob URLs cannot benefit from the remote image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={image} alt={name} />;
}

export function DemoFivePhotoEditor({ edit, onSave, onClose }: { edit: PhotoEdit; onSave: (photo: DraftPhoto) => Promise<void>; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(edit.existing?.photoName ?? "");
  const [classification, classify] = useReducer(photoClassificationReducer, {
    category: edit.existing?.category ?? edit.category,
    photoType: edit.existing?.photoType ?? "",
  });
  const [status, setStatus] = useState<ConditionStatus | "">(edit.existing?.conditionStatus ?? "");
  const [description, setDescription] = useState(edit.existing?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const savingRef = useRef(false);

  useEffect(() => {
    const previous = edit.returnFocus ?? document.activeElement as HTMLElement | null;
    const node = dialog.current;
    node?.showModal();
    if (!edit.viewOnly) nameInput.current?.focus();
    return () => { node?.close(); previous?.focus(); };
  }, [edit.viewOnly, edit.returnFocus]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    const result = validateDraftPhoto({ ...edit.image, clientPhotoId: edit.existing?.clientPhotoId ?? crypto.randomUUID(), photoName: name,
      category: classification.category, photoType: classification.photoType, conditionStatus: status, description, capturedAt: edit.capturedAt });
    if (!result.ok) { setError(result.error); return; }
    savingRef.current = true; setSaving(true); setError("");
    try { await onSave(result.value); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not save this photo. Free device storage and try again."); }
    finally { savingRef.current = false; setSaving(false); }
  }

  return <dialog ref={dialog} className="demo-five-editor" role="dialog" aria-modal="true" aria-labelledby="demo-five-editor-title" onCancel={event => { event.preventDefault(); if (!savingRef.current) onClose(); }}>
    <h3 id="demo-five-editor-title">{edit.viewOnly ? name : `${edit.existing ? "Retake" : "Save"} ${classification.category ? `${photoLabel(classification.category)} ` : ""}photo`}</h3>
    <DraftPhotoPreview blob={edit.image.blob} name={name || `${classification.category ? photoLabel(classification.category) : "Photo"} capture preview`} />
    {edit.viewOnly ? <><p>{photoLabel(classification.photoType)} · {status && conditionLabel(status)}</p><p>{description}</p><button type="button" onClick={onClose}>Close photo</button></> : <form onSubmit={save}>
      <fieldset disabled={saving}>
        <label>Photo name<input ref={nameInput} name="photoName" required maxLength={255} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Front entrance from driveway" /></label>
        <label>Category<select name="category" required value={classification.category} onChange={event => classify({ type: "category", category: event.target.value as PhotoCategory | "" })}><option value="">Choose a category</option>{PHOTO_CATEGORIES.map(value => <option value={value} key={value}>{photoLabel(value)}</option>)}</select></label>
        <label>Photo type<select name="photoType" required value={classification.photoType} onChange={event => classify({ type: "photoType", photoType: event.target.value as PhotoType | "" })}><option value="">Choose a photo type</option>{getPhotoTypeOptions(classification.category).map(value => <option value={value} key={value}>{photoLabel(value)}</option>)}</select></label>
        <label>Condition status<select name="conditionStatus" required value={status} onChange={event => setStatus(event.target.value as ConditionStatus)}><option value="">Choose condition</option>{CONDITION_STATUSES.map(value => <option value={value} key={value}>{CONDITION_STATUS_DETAILS[value].label}</option>)}</select></label>
        {status && <p className="demo-five-condition-help">{CONDITION_STATUS_DETAILS[status].description}</p>}
        <label>Description (optional)<textarea name="description" maxLength={5000} value={description} onChange={event => setDescription(event.target.value)} />{status === "not_accessible" && <small>Explain why the area or item was not accessible in Description.</small>}</label>
        <div className="demo-five-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">{saving ? "Saving photo…" : "Save photo"}</button></div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form>}
  </dialog>;
}
