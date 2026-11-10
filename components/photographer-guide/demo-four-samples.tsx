"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

const tabs = ["Exterior", "Street View", "Video Tours", "Interior", "Mechanicals"] as const;
type SampleTab = (typeof tabs)[number];
type GalleryTab = Extract<SampleTab, "Exterior" | "Interior" | "Mechanicals">;

const galleryGroups: Record<GalleryTab, readonly { label: string; src: string }[]> = {
  Exterior: [
    { label: "Front exterior", src: "/images/photo-examples/equity-drive/1.jpg" },
    { label: "Front and side angle", src: "/images/photo-examples/equity-drive/16.jpg" },
    { label: "Rear and side angle", src: "/images/photo-examples/equity-drive/20.jpg" },
    { label: "Rear elevation", src: "/images/photo-examples/equity-drive/21.jpg" },
  ],
  Interior: [
    { label: "Living Room", src: "/images/photo-examples/equity-drive/2.jpg" },
    { label: "Kitchen", src: "/images/photo-examples/equity-drive/6.jpg" },
    { label: "Interior room", src: "/images/photo-examples/equity-drive/7.jpg" },
    { label: "Bathroom", src: "/images/photo-examples/equity-drive/13.jpg" },
  ],
  Mechanicals: [
    { label: "Water heater", src: "/images/photo-examples/equity-drive/14.jpg" },
    { label: "Exterior HVAC unit", src: "/images/photo-examples/equity-drive/19.jpg" },
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
      {activeTab === "Street View" && <div className="demo-four-street-view"><iframe title="Interactive 360 Street View" src="https://maps.google.com/maps?q=40.3409,-76.4113&layer=c&cbll=40.3409,-76.4113&cbp=11,0,0,0,0&output=svembed" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" /></div>}
      {activeTab === "Video Tours" && <article className="demo-four-sample demo-four-video"><video controls playsInline muted preload="metadata" poster="/images/photo-examples/equity-drive/20.jpg"><source src="/videos/demo-4-property-tour.mp4" type="video/mp4" /></video><span><strong><Play size={13} fill="currentColor" aria-hidden="true" /> Full Property Video Tour</strong><small>Complete property walkthrough</small></span></article>}
    </div>
  </div>;
}
