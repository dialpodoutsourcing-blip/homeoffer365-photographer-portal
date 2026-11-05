import Link from "next/link";
import { ArrowUpRight, Camera, ClipboardCheck, Upload, Headphones } from "lucide-react";

const steps = [
  { href: "/photographers/photo-guide", icon: Camera, title: "Review the photo guide", description: "Explore the shot lists, example galleries, and walkthrough clip.", step: "01" },
  { href: "/photographers/checklist", icon: ClipboardCheck, title: "Check your coverage", description: "Work through every required area before submitting.", step: "02" },
  { href: "/photographers/upload", icon: Upload, title: "Open your property visit", description: "Use your team's private link to upload files and submit.", step: "03" },
  { href: "/photographers/help", icon: Headphones, title: "Get help when needed", description: "Find guidance for missing areas and appointment questions.", step: "04" },
];

export function GuideSteps() {
  return <section className="guide-steps" aria-labelledby="guide-steps-heading"><div className="resources-intro"><span className="eyebrow">YOUR PROPERTY VISIT</span><h2 id="guide-steps-heading">Everything you need, one step at a time.</h2><p>Choose a page to get started. Your sidebar stays with you along the way.</p></div><div className="step-grid">{steps.map(({ href, icon: Icon, title, description, step }) => <Link className="step-card" href={href} key={href}><div className="step-card-top"><Icon size={24} aria-hidden="true" /><span>{step}</span></div><h3>{title}</h3><p>{description}</p><span className="step-action">Open page <ArrowUpRight size={16} aria-hidden="true" /></span></Link>)}</div></section>;
}
