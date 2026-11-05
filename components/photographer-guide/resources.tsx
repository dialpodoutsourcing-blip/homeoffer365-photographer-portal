import { Users, Star, Globe } from "lucide-react";
import { guideLinks } from "@/content/photographer-guide";
import { ResourceLink } from "./resource-link";

export function Resources() {
  return <section id="about" className="resources" aria-labelledby="resources-heading"><div className="resources-intro"><span className="eyebrow">A TEAM YOU CAN COUNT ON</span><h2 id="resources-heading">Get to know Home Offer 365.</h2><p>People first. At every step of the process.</p></div><div className="resource-cards"><article><Users size={23} aria-hidden="true" /><h3>Meet your team</h3><p>Get to know the people you’ll be working with.</p><ResourceLink href={guideLinks.team}>Meet our team</ResourceLink></article><article><Globe size={23} aria-hidden="true" /><h3>Our company</h3><p>Learn more about our approach to helping homeowners.</p><ResourceLink href={guideLinks.website}>Visit our website</ResourceLink></article><article><Star size={23} aria-hidden="true" /><h3>Homeowner stories</h3><p>Discover the experience we aim to provide.</p><ResourceLink href={guideLinks.stories}>Explore homeowner stories</ResourceLink></article></div></section>;
}
