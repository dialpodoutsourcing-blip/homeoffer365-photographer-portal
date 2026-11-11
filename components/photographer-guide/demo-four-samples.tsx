"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

const tabs = ["Exterior", "Street View", "Video Walkthroughs", "Interior", "Basement", "Mechanicals"] as const;
type SampleTab = (typeof tabs)[number];
type GalleryTab = Extract<SampleTab, "Exterior" | "Interior" | "Basement" | "Mechanicals">;

const galleryGroups: Record<GalleryTab, readonly { label: string; src: string }[]> = {
  Exterior: [
    { label: "Front exterior", src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-front.png" },
    { label: "Front and driveway", src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-front-driveway.png" },
    { label: "Side yard", src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-side-yard.png" },
    { label: "Front and side angle", src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-rear-side.png" },
    { label: "Property boundary and fence", src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-fence-property-boundary.png" },
    { label: "Rear elevation", src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-rear.png" },
    { label: "Exterior AC condenser", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-ac-condenser.png" },
    { label: "Exterior electrical service", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-electrical-service-context.png" },
    { label: "Front-left curb view", src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-front-left-curb.webp" },
    { label: "Right-side elevation", src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-right-side-elevation.webp" },
    { label: "Backyard and rear elevation", src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-backyard-wide.webp" },
    { label: "Roof, soffit, and gutters", src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-roof-soffit-gutters.webp" },
  ],
  Interior: [
    { label: "Living Room", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-living-room.png" },
    { label: "Dining Area", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-dining-area.png" },
    { label: "Hallway and room layout", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-hallway-layout.png" },
    { label: "Kitchen", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-kitchen.png" },
    { label: "Kitchen under-sink plumbing", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-under-sink-plumbing.png" },
    { label: "Primary Bedroom", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-bedroom.png" },
    { label: "Second Bedroom", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-second-bedroom.png" },
    { label: "Bathroom", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-bathroom.png" },
    { label: "Bathroom vanity plumbing", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-bathroom-vanity-plumbing.png" },
    { label: "Laundry Room", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-laundry.png" },
    { label: "Entry foyer", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-entry-foyer.webp" },
    { label: "Living room reverse view", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-living-room-reverse.webp" },
    { label: "Dining room reverse view", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-dining-room-reverse.webp" },
    { label: "Kitchen wide view", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-kitchen-wide.webp" },
    { label: "Kitchen appliance wall", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-kitchen-appliance-wall.webp" },
    { label: "Kitchen cabinets and counters", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-kitchen-cabinet-counter.webp" },
    { label: "Primary bedroom reverse view", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-primary-bedroom-reverse.webp" },
    { label: "Primary bedroom closet", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-primary-closet.webp" },
    { label: "Second bedroom reverse view", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-second-bedroom-reverse.webp" },
    { label: "Bathroom tub and shower", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-bathroom-tub-shower.webp" },
    { label: "Hallway linen storage", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-hallway-linen-storage.webp" },
    { label: "Mudroom and back entry", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-mudroom-back-entry.webp" },
    { label: "Basement stair access", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-basement-stair-door.webp" },
    { label: "Laundry reverse view", src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-laundry-reverse.webp" },
  ],
  Basement: [
    { label: "Basement overview", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-basement-overview.png" },
    { label: "Basement stair landing", src: "/images/photo-examples/pennsylvania-brick-bungalow/basement-stair-landing.webp" },
    { label: "Foundation walls", src: "/images/photo-examples/pennsylvania-brick-bungalow/basement-foundation-walls.webp" },
    { label: "Floor drain condition", src: "/images/photo-examples/pennsylvania-brick-bungalow/basement-floor-drain-condition.webp" },
    { label: "Basement window and egress", src: "/images/photo-examples/pennsylvania-brick-bungalow/basement-window-egress.webp" },
    { label: "Basement storage area", src: "/images/photo-examples/pennsylvania-brick-bungalow/basement-storage-area.webp" },
    { label: "Support beam and columns", src: "/images/photo-examples/pennsylvania-brick-bungalow/basement-support-beam-columns.webp" },
    { label: "Basement exterior exit", src: "/images/photo-examples/pennsylvania-brick-bungalow/basement-exterior-exit.webp" },
  ],
  Mechanicals: [
    { label: "Furnace and ductwork", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-furnace-ductwork.png" },
    { label: "Modern furnace", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-furnace-modern.png" },
    { label: "Water heater", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-water-heater.png" },
    { label: "Water softener", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-water-softener.png" },
    { label: "Well pump system", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-well-pump.png" },
    { label: "Breaker panel", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-breaker-panel.png" },
    { label: "Main water shutoff", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-main-water-shutoff.webp" },
    { label: "Sump pump", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-sump-pump.webp" },
    { label: "HVAC service connections", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-hvac-service-connections.webp" },
    { label: "Plumbing distribution", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-plumbing-distribution.webp" },
  ],
};

export function DemoFourSamples() {
  const [activeTab, setActiveTab] = useState<SampleTab>("Exterior");
  const [selectedIndex, setSelectedIndex] = useState(0);

  function selectTab(tab: SampleTab) {
    setActiveTab(tab);
    setSelectedIndex(0);
  }

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + offset + tabs.length) % tabs.length;
    selectTab(tabs[nextIndex]);
    document.getElementById(`demo-four-tab-${nextIndex}`)?.focus();
  }

  const gallery = activeTab === "Exterior" || activeTab === "Interior" || activeTab === "Basement" || activeTab === "Mechanicals" ? galleryGroups[activeTab] : null;
  const selectedPhoto = gallery?.[selectedIndex] ?? gallery?.[0];

  return <div className="demo-four-sample-tabs">
    <div className="demo-four-tab-list" role="tablist" aria-label="Photo and video sample categories">
      {tabs.map((tab, index) => <button id={`demo-four-tab-${index}`} type="button" role="tab" aria-selected={activeTab === tab} aria-controls="demo-four-sample-panel" tabIndex={activeTab === tab ? 0 : -1} onClick={() => selectTab(tab)} onKeyDown={(event) => moveTab(event, index)} key={tab}>{tab}</button>)}
    </div>
    <div id="demo-four-sample-panel" className="demo-four-sample-panel" role="tabpanel" aria-label={`${activeTab} samples`}>
      {gallery && selectedPhoto && <div className="demo-four-gallery">
        <figure className="demo-four-gallery-main"><Image src={selectedPhoto.src} alt={`${selectedPhoto.label} example`} width={1200} height={760} sizes="(max-width: 760px) 100vw, 1100px" /><figcaption>{selectedPhoto.label}</figcaption></figure>
        <div className="demo-four-gallery-thumbnails" aria-label={`${activeTab} photo choices`}>
          {gallery.map((photo, index) => <button type="button" aria-label={`Show ${photo.label}`} aria-pressed={selectedIndex === index} onClick={() => setSelectedIndex(index)} key={photo.src}><Image src={photo.src} alt="" width={150} height={96} sizes="90px" /></button>)}
        </div>
      </div>}
      {activeTab === "Street View" && <div className="demo-four-street-view">
        <iframe
          title="Interactive 360° Google Street View"
          src="https://maps.google.com/maps?q=33.900886,-84.534285&layer=c&cbll=33.900886,-84.534285&cbp=11,0,0,0,0&output=svembed"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          style={{ width: "100%", height: "clamp(380px, 62vw, 680px)", display: "block", border: 0 }}
        />
      </div>}
      {activeTab === "Video Walkthroughs" && <div className="demo-four-walkthrough-grid" style={{ gridTemplateColumns: "1fr" }}>
        <article className="demo-four-sample demo-four-video"><video controls playsInline muted preload="metadata" poster="/images/photo-examples/demo-4-interior-supplied-tour-v3-poster.jpg" aria-label="Continuous interior video walkthrough"><source src="/videos/demo-4-interior-supplied-tour-v3.mp4" type="video/mp4" />Your browser does not support embedded video.</video><span><strong><Play size={13} fill="currentColor" aria-hidden="true" /> Interior Video Walkthrough</strong><small>One continuous room-to-room walkthrough inside the home</small></span></article>
      </div>}
    </div>
  </div>;
}
