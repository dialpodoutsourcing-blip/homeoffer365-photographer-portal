"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { getPhotoTypeOptions, validateDraftPhoto, type DraftPhoto, type PhotoType, type ConditionStatus } from "@/lib/demo-five/photo-workflow";
import type { PhotoEdit } from "@/lib/demo-five/photo-form-state";

export function photoLabel(value: string) {
  return value === "hvac" ? "HVAC" : value.split("_").map(word => word[0].toUpperCase() + word.slice(1)).join(" ");
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
  const [type, setType] = useState<PhotoType | "">(edit.existing?.photoType ?? "");
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
      category: edit.category, photoType: type, conditionStatus: status, description, capturedAt: edit.capturedAt });
    if (!result.ok) { setError(result.error); return; }
    savingRef.current = true; setSaving(true); setError("");
    try { await onSave(result.value); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not save this photo. Free device storage and try again."); }
    finally { savingRef.current = false; setSaving(false); }
  }

  return <dialog ref={dialog} className="demo-five-editor" role="dialog" aria-modal="true" aria-labelledby="demo-five-editor-title" onCancel={event => { event.preventDefault(); if (!savingRef.current) onClose(); }}>
    <h3 id="demo-five-editor-title">{edit.viewOnly ? name : `${edit.existing ? "Retake" : "Save"} ${photoLabel(edit.category)} photo`}</h3>
    <DraftPhotoPreview blob={edit.image.blob} name={name || `${photoLabel(edit.category)} capture preview`} />
    {edit.viewOnly ? <><p>{photoLabel(type)} · {photoLabel(status)}</p><p>{description}</p><button type="button" onClick={onClose}>Close photo</button></> : <form onSubmit={save}>
      <fieldset disabled={saving}>
        <label>Photo name<input ref={nameInput} name="photoName" required maxLength={255} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Front entrance from driveway" /></label>
        <label>Photo type<select name="photoType" required value={type} onChange={event => setType(event.target.value as PhotoType)}><option value="">Choose a photo type</option>{getPhotoTypeOptions(edit.category).map(value => <option value={value} key={value}>{photoLabel(value)}</option>)}</select></label>
        <label>Condition status<select name="conditionStatus" required value={status} onChange={event => setStatus(event.target.value as ConditionStatus)}><option value="">Choose condition</option><option value="good_condition">Good Condition</option><option value="damage">Damage</option></select></label>
        <label>Description (optional)<textarea name="description" maxLength={5000} value={description} onChange={event => setDescription(event.target.value)} /></label>
        <div className="demo-five-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">{saving ? "Saving photo…" : "Save photo"}</button></div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form>}
  </dialog>;
}
