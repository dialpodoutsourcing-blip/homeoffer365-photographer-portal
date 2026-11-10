"use client";

import Image from "next/image";
import { ExternalLink, Play } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

const tabs = ["Exterior", "Street View", "Videos", "Interior", "Mechanicals"] as const;
type SampleTab = (typeof tabs)[number];

const photoGroups: Record<Exclude<SampleTab, "Videos">, readonly { label: string; detail: string; src: string; href?: string }[]> = {
  Exterior: [{ label: "Exterior Photos", detail: "Front, back & sides", src: "/images/photo-examples/equity-drive/1.jpg" }],
  "Street View": [{ label: "360 Street View", detail: "Property & surroundings", src: "/images/photo-examples/equity-drive/18.jpg", href: "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=40.3409%2C-76.4113" }],
  Interior: [
    { label: "Living Room", detail: "Wide corner view", src: "/images/photo-examples/equity-drive/2.jpg" },
    { label: "Kitchen", detail: "Full layout & appliances", src: "/images/photo-examples/equity-drive/6.jpg" },
    { label: "Bathroom", detail: "Fixtures & condition", src: "/images/photo-examples/equity-drive/13.jpg" },
  ],
  Mechanicals: [{ label: "Mechanicals", detail: "HVAC, heater & panels", src: "/images/photo-examples/equity-drive/14.jpg" }],
};

export function DemoFourSamples() {
  const [activeTab, setActiveTab] = useState<SampleTab>("Exterior");

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + offset + tabs.length) % tabs.length;
    setActiveTab(tabs[nextIndex]);
    document.getElementById(`demo-four-tab-${nextIndex}`)?.focus();
  }

  return <div className="demo-four-sample-tabs">
    <div className="demo-four-tab-list" role="tablist" aria-label="Photo and video sample categories">
      {tabs.map((tab, index) => <button id={`demo-four-tab-${index}`} type="button" role="tab" aria-selected={activeTab === tab} aria-controls="demo-four-sample-panel" tabIndex={activeTab === tab ? 0 : -1} onClick={() => setActiveTab(tab)} onKeyDown={(event) => moveTab(event, index)} key={tab}>{tab}</button>)}
    </div>
    <div id="demo-four-sample-panel" className="demo-four-sample-panel" role="tabpanel" aria-label={`${activeTab} samples`}>
      {activeTab === "Videos" ? <>
        <article className="demo-four-sample demo-four-video"><video controls playsInline muted preload="metadata" poster="/images/photo-examples/equity-drive/20.jpg"><source src="/videos/demo-4-property-tour.mp4" type="video/mp4" /></video><span><strong><Play size={13} fill="currentColor" aria-hidden="true" /> Full Property Video Tour</strong><small>Complete property walkthrough</small></span></article>
      </> : photoGroups[activeTab].map((sample) => {
        const content = <><Image src={sample.src} alt={`${sample.label} example`} width={680} height={360} /><span><strong>{sample.label}</strong><small>{sample.detail}</small></span>{sample.href && <ExternalLink size={15} aria-hidden="true" />}</>;
        return sample.href ? <a className="demo-four-sample" href={sample.href} target="_blank" rel="noopener noreferrer" key={sample.label}>{content}</a> : <article className="demo-four-sample" key={sample.label}>{content}</article>;
      })}
    </div>
  </div>;
}
