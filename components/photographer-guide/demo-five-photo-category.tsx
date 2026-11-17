"use client";

import { OPTIONAL_FEATURES, PHOTO_MINIMUMS, type DraftPhoto, type PhotoCategory, type NotApplicableSelection, type PhotoType } from "@/lib/demo-five/photo-workflow";
import { DraftPhotoPreview, photoLabel } from "./demo-five-photo-editor";

type Props = {
  category: PhotoCategory; photos: DraftPhoto[]; notApplicable: NotApplicableSelection[]; disabled: boolean;
  onRetake: (photo: DraftPhoto, button: HTMLButtonElement) => void;
  onRemove: (photo: DraftPhoto) => void;
  onNotApplicable: (category: PhotoCategory, type: PhotoType, checked: boolean) => void;
};

export function DemoFivePhotoCategory({ category, photos, notApplicable, disabled, onRetake, onRemove, onNotApplicable }: Props) {
  const minimum = PHOTO_MINIMUMS[category];
  return <section className="demo-five-category" role="tabpanel" id={`demo-five-panel-${category}`} aria-labelledby={`demo-five-tab-${category}`} tabIndex={0}>
    <div className="demo-five-category-heading"><strong>{photoLabel(category)}</strong><span aria-live="polite">{minimum === 0 ? `${photos.length} photos — Optional` : `${photos.length}/${minimum} photos ${photos.length >= minimum ? "— Complete" : "— Needed"}`}</span></div>
    <div className="demo-five-category-content">
      {OPTIONAL_FEATURES[category].length > 0 && <details className="demo-five-na-disclosure">
        <summary>Mark feature N/A</summary>
        <div className="demo-five-na">{OPTIONAL_FEATURES[category].map(type => <label key={type}><input type="checkbox" disabled={disabled} checked={notApplicable.some(item => item.category === category && item.photoType === type)} onChange={event => onNotApplicable(category, type, event.target.checked)} />{photoLabel(type)} N/A</label>)}</div>
      </details>}
      {photos.length === 0 && <p className="demo-five-empty">No {photoLabel(category)} photos yet. Choose this area above, then take or upload photos.</p>}
      <ul className="demo-five-thumbnails">{photos.map(photo => <li key={photo.clientPhotoId}>
        <DraftPhotoPreview blob={photo.blob} name={`${photoLabel(category)} property photo`} />
        <div className="demo-five-actions">
          <button type="button" disabled={disabled} aria-label={`Retake ${photoLabel(category)} photo`} onClick={event => onRetake(photo, event.currentTarget)}>Retake</button>
          <button type="button" disabled={disabled} onClick={() => onRemove(photo)} aria-label={`Remove ${photoLabel(category)} photo`}>Remove</button>
        </div>
      </li>)}</ul>
    </div>
  </section>;
}
