"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, ClipboardCheck, Link2, ShieldCheck, Upload } from "lucide-react";
import { getSharedVisitPath } from "@/lib/portal/visit-links";

export function GuestLanding() {
  const [error, setError] = useState("");
  function openLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const path = getSharedVisitPath(String(new FormData(event.currentTarget).get("link")), window.location.origin);
    if (!path) { setError("Paste the complete private property link your team provided for this website."); return; }
    window.location.assign(path);
  }
  return <div className="portal-workspace"><section className="panel portal-panel guest-landing"><span className="visit-auth-icon"><Link2 size={26} aria-hidden="true" /></span><span className="eyebrow">FOR PHOTOGRAPHERS</span><h2>Your property. One private link.</h2><p>Open the property visit link sent by your Home Offer 365 team member. No account, email sign-in, or password is needed.</p>
    <div className="guest-steps"><div><Link2 size={22} aria-hidden="true" /><strong>01 · Open your link</strong><p>Check the property address before getting started.</p></div><div><Upload size={22} aria-hidden="true" /><strong>02 · Add your files</strong><p>Organize photos and walkthrough video by category.</p></div><div><ClipboardCheck size={22} aria-hidden="true" /><strong>03 · Review & submit</strong><p>Complete the checklist, report exceptions, and save your receipt.</p></div></div>
    <form className="portal-form guest-link-form" onSubmit={openLink}><label>Have your property link?<input type="url" name="link" required autoComplete="off" placeholder="Paste the complete private visit link" /></label><button className="button primary">Open visit<ArrowRight size={17} aria-hidden="true" /></button></form>
    {error && <p className="portal-error" role="alert">{error}</p>}
    <p className="guest-link-help">Need a link? Contact your assigned team member. Each link is limited to its property and expires automatically.</p><Link href="/photographers/photo-guide" className="resource-link">Review the photo guide →</Link>
  </section><section className="guest-staff-access"><ShieldCheck size={22} aria-hidden="true" /><div><h2>Managing property visits?</h2><p>Staff can create visits, share private links, and review submissions.</p></div><Link href="/photographers/staff" className="button secondary">Staff access<ArrowRight size={16} aria-hidden="true" /></Link></section></div>;
}
