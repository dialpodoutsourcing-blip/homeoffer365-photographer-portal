"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

const tabs = ["Exterior", "Street View", "Video Walkthroughs", "Interior", "Mechanicals"] as const;
type SampleTab = (typeof tabs)[number];
type GalleryTab = Extract<SampleTab, "Exterior" | "Interior" | "Mechanicals">;

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
    { label: "Exterior electrical meter", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-electric-meter-close.jpg" },
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
  ],
  Mechanicals: [
    { label: "Basement utility overview", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-basement-overview.png" },
    { label: "Furnace and ductwork", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-furnace-ductwork.png" },
    { label: "Modern furnace", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-furnace-modern.png" },
    { label: "Water heater", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-water-heater.png" },
    { label: "Water softener", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-water-softener.png" },
    { label: "Well pump system", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-well-pump.png" },
    { label: "Breaker panel", src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-breaker-panel.png" },
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

  const gallery = activeTab === "Exterior" || activeTab === "Interior" || activeTab === "Mechanicals" ? galleryGroups[activeTab] : null;
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
      {activeTab === "Video Walkthroughs" && <div className="demo-four-walkthrough-grid">
        <article className="demo-four-sample demo-four-video"><video controls playsInline muted preload="metadata" poster="/images/photo-examples/demo-4-exterior-guided-tour-v2-poster.jpg" aria-label="Continuous exterior video walkthrough"><source src="/videos/demo-4-exterior-guided-tour-v2.mp4" type="video/mp4" />Your browser does not support embedded video.</video><span><strong><Play size={13} fill="currentColor" aria-hidden="true" /> Exterior Video Walkthrough</strong><small>One continuous walk around the home and property</small></span></article>
        <article className="demo-four-sample demo-four-video"><video controls playsInline muted preload="metadata" poster="/images/photo-examples/demo-4-interior-supplied-tour-v3-poster.jpg" aria-label="Continuous interior video walkthrough"><source src="/videos/demo-4-interior-supplied-tour-v3.mp4" type="video/mp4" />Your browser does not support embedded video.</video><span><strong><Play size={13} fill="currentColor" aria-hidden="true" /> Interior Video Walkthrough</strong><small>One continuous room-to-room walkthrough inside the home</small></span></article>
      </div>}
    </div>
  </div>;
}
