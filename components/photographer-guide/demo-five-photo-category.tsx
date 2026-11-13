"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import { OPTIONAL_FEATURES, PHOTO_MINIMUMS, getPhotoTypeOptions, type DraftPhoto, type PhotoCategory, type NotApplicableSelection, type PhotoType } from "@/lib/demo-five/photo-workflow";
import { DraftPhotoPreview, photoLabel } from "./demo-five-photo-editor";

type Props = {
  category: PhotoCategory; photos: DraftPhoto[]; notApplicable: NotApplicableSelection[]; disabled: boolean;
  onCapture: (file: File, category: PhotoCategory, existing?: DraftPhoto) => void;
  onView: (photo: DraftPhoto) => void; onRemove: (photo: DraftPhoto) => void;
  onNotApplicable: (category: PhotoCategory, type: PhotoType, checked: boolean) => void;
  onCancelCapture: () => void;
};

export function DemoFivePhotoCategory({ category, photos, notApplicable, disabled, onCapture, onView, onRemove, onNotApplicable, onCancelCapture }: Props) {
  const camera = useRef<HTMLInputElement>(null), picker = useRef<HTMLInputElement>(null);
  const retake = useRef<DraftPhoto | undefined>(undefined);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const minimum = PHOTO_MINIMUMS[category];
  useEffect(() => {
    const inputs = [camera.current, picker.current];
    const cancel = () => { retake.current = undefined; trigger.current?.focus(); onCancelCapture(); };
    inputs.forEach(input => input?.addEventListener("cancel", cancel));
    return () => inputs.forEach(input => input?.removeEventListener("cancel", cancel));
  }, [onCancelCapture]);
  function selected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    trigger.current?.focus();
    if (file) onCapture(file, category, retake.current);
    else onCancelCapture();
    retake.current = undefined;
  }
  return <details className="demo-five-category" open>
    <summary><strong>{photoLabel(category)}</strong><span aria-live="polite">{photos.length}/{minimum} photos {photos.length >= minimum ? "— Complete" : "— Needed"}</span></summary>
    <div className="demo-five-category-content">
      <p className="demo-five-type-hint">{getPhotoTypeOptions(category).map(photoLabel).join(" · ")}</p>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden disabled={disabled} onChange={selected} />
      <input ref={picker} type="file" accept="image/*" hidden disabled={disabled} onChange={selected} />
      <div className="demo-five-actions">
        <button type="button" disabled={disabled} onClick={event => { trigger.current = event.currentTarget; retake.current = undefined; camera.current?.click(); }}>Take Photo<span className="sr-only"> — {photoLabel(category)}</span></button>
        <button type="button" disabled={disabled} onClick={event => { trigger.current = event.currentTarget; retake.current = undefined; picker.current?.click(); }}>Choose image<span className="sr-only"> — {photoLabel(category)}</span></button>
      </div>
      <div className="demo-five-na">{OPTIONAL_FEATURES[category].map(type => <label key={type}><input type="checkbox" disabled={disabled} checked={notApplicable.some(item => item.category === category && item.photoType === type)} onChange={event => onNotApplicable(category, type, event.target.checked)} />{photoLabel(type)} N/A</label>)}</div>
      <ul className="demo-five-thumbnails">{photos.map(photo => <li key={photo.clientPhotoId}>
        <DraftPhotoPreview blob={photo.blob} name={photo.photoName} />
        <strong>{photo.photoName}</strong><small>{photoLabel(photo.photoType)} · {photoLabel(photo.conditionStatus)}</small>
        <div className="demo-five-actions">
          <button type="button" disabled={disabled} onClick={() => onView(photo)} aria-label={`View ${photo.photoName}`}>View</button>
          <button type="button" disabled={disabled} aria-label={`Retake ${photo.photoName}`} onClick={event => { trigger.current = event.currentTarget; retake.current = photo; camera.current?.click(); }}>Retake</button>
          <button type="button" disabled={disabled} onClick={() => onRemove(photo)} aria-label={`Remove ${photo.photoName}`}>Remove</button>
        </div>
      </li>)}</ul>
    </div>
  </details>;
}
