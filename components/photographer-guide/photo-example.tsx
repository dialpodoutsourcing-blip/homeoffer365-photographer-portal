"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

type ExampleImage = {
  src: string;
  alt: string;
  label: string;
  note: string;
};

type PhotoExampleProps = {
  title: string;
  src: string;
  alt: string;
  note: string;
  examples?: readonly ExampleImage[];
};

export function PhotoExample({ title, src, alt, note, examples }: PhotoExampleProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const images = examples?.length ? examples : [{ src, alt, note, label: "Overview" }];
  const selected = images[selectedIndex] ?? images[0];
  const isGallery = images.length > 1;

  function openExample() {
    setSelectedIndex(0);
    dialog.current?.showModal();
  }

  return (
    <>
      <button className="example-button" type="button" onClick={openExample} aria-haspopup="dialog">
        {isGallery ? `View ${images.length} examples` : "View example"} <Maximize2 size={14} aria-hidden="true" />
        <span className="sr-only">: {title}</span>
      </button>
      <dialog
        ref={dialog}
        className="example-dialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}
      >
        <div className="example-dialog-content">
          <div className="example-dialog-toolbar">
          <header className="example-dialog-header">
            <div><h2 id={titleId}>{title}</h2></div>
            <form method="dialog"><button className="dialog-close" aria-label="Close photo example"><X size={22} aria-hidden="true" /></button></form>
          </header>
          {isGallery && (
            <div className="example-gallery-controls">
              <button type="button" onClick={() => setSelectedIndex((index) => (index - 1 + images.length) % images.length)} aria-label={`Previous ${title} example`}><ChevronLeft size={18} aria-hidden="true" /></button>
              <p role="status" aria-live="polite">{selectedIndex + 1} / {images.length} · {selected.label}</p>
              <button type="button" onClick={() => setSelectedIndex((index) => (index + 1) % images.length)} aria-label={`Next ${title} example`}><ChevronRight size={18} aria-hidden="true" /></button>
            </div>
          )}
          </div>
          <div className="example-dialog-body" role="region" aria-label={`${title} image and details`} tabIndex={0}>
          <figure>
            <Image key={selected.src} src={selected.src} alt={selected.alt} width={1200} height={896} sizes="(max-width: 900px) 90vw, 860px" loading="lazy" />
            <figcaption id={descriptionId}>{selected.note}</figcaption>
          </figure>
          {isGallery && (
            <div className="example-thumbnails" role="group" aria-label={`Choose ${title} view`}>
              {images.map((image, index) => (
                <button type="button" key={image.src} aria-pressed={selectedIndex === index} onClick={() => setSelectedIndex(index)}>
                  <Image src={image.src} alt="" width={150} height={112} sizes="130px" loading="lazy" />
                  <span>{image.label}</span>
                </button>
              ))}
            </div>
          )}
          <p className="example-disclaimer">Illustrative sample supplied for this guide. It is not a photograph of an inspected property.</p>
          </div>
        </div>
      </dialog>
    </>
  );
}
