import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Heart, MessageCircle, Users } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { teamDepartments, teamFounder } from "@/content/company-resources";

export const metadata: Metadata = { title: "Meet Our Team | Home Offer 365" };

export default function TeamPage() {
  return (
    <>
      <Link className="button primary back-to-welcome" href="/photographers"><ArrowLeft size={20} aria-hidden="true" />Back to Welcome</Link>
      <PageHeading label="HOME OFFER 365 / OUR TEAM" title="The people behind every property visit." description="Get to know the people who help connect the details, support homeowners, and keep the process moving with care." />
      <div className="company-values-banner"><Heart size={25} aria-hidden="true" /><div><h2>People Over Profit.</h2><p>One shared purpose: honest communication, accurate information, and a thoughtful homeowner experience.</p></div></div>

      <section className="team-founder-section" aria-labelledby="founder-heading">
        <div className="team-section-heading"><span className="eyebrow">LEADERSHIP</span><h2 id="founder-heading">Leading with care.</h2><p>A personal introduction to the purpose behind the work.</p></div>
        <article className="founder-profile">
          <div className="founder-identity"><Image className="founder-avatar" src={teamFounder.photo} alt={`${teamFounder.name}, ${teamFounder.role}`} width={140} height={140} priority /><span className="eyebrow">MEET OUR FOUNDER</span><h3>{teamFounder.name}</h3><p>{teamFounder.role}</p><span className="founder-value"><Heart size={15} aria-hidden="true" />People first. Always.</span></div>
          <div className="founder-message"><span className="eyebrow">A PERSONAL NOTE</span><h3>{teamFounder.introduction}</h3><blockquote>{teamFounder.note}</blockquote>{teamFounder.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<div className="founder-signature">Warmly,<strong>{teamFounder.signature}</strong></div></div>
        </article>
      </section>

      <nav className="team-department-nav" aria-label="Browse team departments">{teamDepartments.map((department) => <a key={department.id} href={`#team-${department.id}`}>{department.title}</a>)}</nav>
      <div className="team-directory">
        {teamDepartments.map((department) => (
          <section key={department.id} id={`team-${department.id}`} aria-labelledby={`heading-${department.id}`}>
            <div className="team-section-heading"><span className="team-section-icon"><Users size={20} aria-hidden="true" /></span><h2 id={`heading-${department.id}`}>{department.title}</h2><p>{department.description}</p></div>
            <div className="team-directory-grid">
              {department.members.map((member) => (
                <article className="team-member-card" key={member.name}>
                  <div className="team-member-top"><Image className="team-member-avatar" src={member.photo} alt={`${member.name}, ${member.role}`} width={58} height={58} /><div><h3>{member.name}</h3><p>{member.role}</p></div></div>
                  <p className="team-member-bio">{member.bio}</p>
                  {member.note && <details className="team-personal-note"><summary><MessageCircle size={15} aria-hidden="true" />Personal note<span aria-hidden="true">+</span></summary><blockquote>{member.note}</blockquote></details>}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="company-page-cta"><div><h2>Not sure who to contact?</h2><p>Your assigned team member is your starting point for questions before or during the visit.</p></div><Link className="button primary" href="/photographers/help">Help & guidance<ArrowRight size={16} aria-hidden="true" /></Link></div>
    </>
  );
}
