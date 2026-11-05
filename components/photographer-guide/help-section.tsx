import { Headphones } from "lucide-react";
import { guideLinks } from "@/content/photographer-guide";
import { ResourceLink } from "./resource-link";

export function HelpSection() {
  return <section id="help" className="help-section"><span className="help-icon"><Headphones size={28} aria-hidden="true" /></span><span className="eyebrow">WE’RE HERE FOR YOU</span><h2>A question along the way?</h2><p>Contact your assigned Home Offer 365 team member before or during your appointment.</p>{guideLinks.support && <ResourceLink href={guideLinks.support}>Contact your team</ResourceLink>}<span className="help-signoff">Thanks for being part of the team.</span></section>;
}
