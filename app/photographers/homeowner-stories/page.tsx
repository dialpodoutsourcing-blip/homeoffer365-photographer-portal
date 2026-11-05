import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, HandHeart, ClipboardCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { homeownerExperience } from "@/content/company-resources";
import { guideLinks } from "@/content/photographer-guide";
import { ResourceLink } from "@/components/photographer-guide/resource-link";

export const metadata: Metadata = { title: "Homeowner Stories | Home Offer 365" };
const icons = [MessageCircle, HandHeart, ClipboardCheck];

export default function HomeownerStoriesPage() {
  return (
    <>
      <Link className="button primary back-to-welcome" href="/photographers"><ArrowLeft size={20} aria-hidden="true" />Back to Welcome</Link>
      <PageHeading label="HOMEOWNER STORIES" title="People first, at every step." description="The experience we work toward: clear communication, a respectful visit, and careful attention to the details." />
      <section className="company-template-grid" aria-label="The homeowner experience">
        {homeownerExperience.map((story, index) => {
          const Icon = icons[index];
          return <article className="panel experience-card" key={story.title}><Icon className="experience-icon" size={31} strokeWidth={1.5} aria-hidden="true" /><span className="eyebrow">{story.stage}</span><h2>{story.title}</h2><p>{story.description}</p><div className="experience-takeaway"><ArrowRight size={16} aria-hidden="true" />{story.takeaway}</div></article>;
        })}
      </section>
      <div className="company-page-cta"><div><h2>Your work shapes the experience.</h2><p>Review the guide to prepare for a clear, considerate property visit.</p>{guideLinks.reviews && <ResourceLink href={guideLinks.reviews}>Read Google reviews</ResourceLink>}</div><Link className="button primary" href="/photographers/photo-guide">Explore the photo guide →</Link></div>
    </>
  );
}
