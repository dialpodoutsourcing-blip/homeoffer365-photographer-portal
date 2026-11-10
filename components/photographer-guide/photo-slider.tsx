"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const photos = [
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-front.png", label: "Front exterior", category: "Exterior" },
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-front-driveway.png", label: "Front and driveway", category: "Exterior" },
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-side-yard.png", label: "Side yard", category: "Exterior" },
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-rear-side.png", label: "Front and side angle", category: "Exterior" },
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-rear.png", label: "Rear elevation", category: "Exterior" },
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-living-room.png", label: "Living room", category: "Interior" },
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-kitchen.png", label: "Kitchen", category: "Interior" },
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-bedroom.png", label: "Bedroom", category: "Interior" },
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-bathroom.png", label: "Bathroom", category: "Interior" },
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-laundry.png", label: "Laundry room", category: "Interior" },
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-furnace-ductwork.png", label: "Furnace and ductwork", category: "Mechanical" },
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-electric-meter-close.jpg", label: "Exterior electrical meter", category: "Mechanical" },
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-electrical-service-context.png", label: "Electrical service context", category: "Mechanical" },
  { src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-under-sink-plumbing.png", label: "Under-sink plumbing", category: "Mechanical" },
] as const;

export function PhotoSlider() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowLeft") setLightboxIndex((current) => current === null ? null : (current - 1 + photos.length) % photos.length);
      if (event.key === "ArrowRight") setLightboxIndex((current) => current === null ? null : (current + 1) % photos.length);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxIndex]);

  function goTo(index: number) {
    const next = Math.max(0, Math.min(photos.length - 1, index));
    const card = track.current?.children.item(next) as HTMLElement | null;
    track.current?.scrollTo({ left: card?.offsetLeft ?? 0, behavior: "smooth" });
    setActive(next);
  }

  function syncPosition() {
    const container = track.current;
    if (!container) return;
    const cards = Array.from(container.children) as HTMLElement[];
    const closest = cards.reduce((best, card, index) => Math.abs(card.offsetLeft - container.scrollLeft) < Math.abs(cards[best].offsetLeft - container.scrollLeft) ? index : best, 0);
    setActive(closest);
  }

  const lightboxPhoto = lightboxIndex === null ? null : photos[lightboxIndex];

  return <div className="photo-slider" role="region" aria-roledescription="carousel" aria-label="Property photo samples">
    <div className="photo-slider-toolbar"><p aria-live="polite">Photo {active + 1} of {photos.length}</p><div><button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous photos"><ArrowLeft size={18} aria-hidden="true" /></button><button type="button" onClick={() => goTo(active + 1)} disabled={active === photos.length - 1} aria-label="Next photos"><ArrowRight size={18} aria-hidden="true" /></button></div></div>
    <div className="photo-slider-track" ref={track} onScroll={syncPosition} tabIndex={0}>{photos.map((photo, index) => <figure key={photo.src} aria-label={`${index + 1} of ${photos.length}: ${photo.label}`}><button className="photo-slider-open" type="button" onClick={() => setLightboxIndex(index)} aria-label={`Enlarge ${photo.label}`}><Image src={photo.src} alt={`${photo.label}, a Home Offer 365 property photography example`} width={960} height={720} sizes="(max-width: 600px) 82vw, (max-width: 1000px) 45vw, 24vw" /><span className="photo-slider-expand" aria-hidden="true"><Expand size={16} /></span></button><figcaption><span>{photo.category}</span><strong>{photo.label}</strong></figcaption></figure>)}</div>
    {lightboxPhoto && <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label={`${lightboxPhoto.label} enlarged photo`} onClick={(event) => { if (event.target === event.currentTarget) setLightboxIndex(null); }}>
      <div className="photo-lightbox-panel">
        <button className="photo-lightbox-close" type="button" onClick={() => setLightboxIndex(null)} aria-label="Close enlarged photo" autoFocus><X size={22} aria-hidden="true" /></button>
        <button className="photo-lightbox-nav photo-lightbox-prev" type="button" onClick={() => setLightboxIndex((current) => current === null ? 0 : (current - 1 + photos.length) % photos.length)} aria-label="Previous enlarged photo"><ArrowLeft size={23} aria-hidden="true" /></button>
        <div className="photo-lightbox-image"><Image src={lightboxPhoto.src} alt={`${lightboxPhoto.label}, a Home Offer 365 property photography example`} width={1440} height={1080} sizes="95vw" priority /></div>
        <button className="photo-lightbox-nav photo-lightbox-next" type="button" onClick={() => setLightboxIndex((current) => current === null ? 0 : (current + 1) % photos.length)} aria-label="Next enlarged photo"><ArrowRight size={23} aria-hidden="true" /></button>
        <div className="photo-lightbox-caption"><div><span>{lightboxPhoto.category}</span><strong>{lightboxPhoto.label}</strong></div><small>{lightboxIndex === null ? 0 : lightboxIndex + 1} / {photos.length}</small></div>
      </div>
    </div>}
  </div>;
}
