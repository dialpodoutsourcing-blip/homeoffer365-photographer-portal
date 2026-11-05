import Link from "next/link";
import { ArrowUpRight, Link2, Check, ClipboardCheck, House, ShieldCheck } from "lucide-react";

export function WorkspaceIntro() {
  return <aside className="visit-intro">
    <span className="visit-intro-icon"><House size={28} aria-hidden="true" /></span>
    <span className="eyebrow">STAFF WORKSPACE</span>
    <h2>A clear picture of every property.</h2>
    <p>Set up the visit, share a private link, and keep every detail together.</p>
    <ol className="visit-intro-steps">
      <li><House size={19} aria-hidden="true" /><div><strong>Start with the address</strong><span>Create a dedicated record for each property visit.</span></div></li>
      <li><Link2 size={19} aria-hidden="true" /><div><strong>Share a private link</strong><span>Photographers open their assigned visit without an account.</span></div></li>
      <li><ClipboardCheck size={19} aria-hidden="true" /><div><strong>Review the submission</strong><span>Find photos, video, checklist answers, and notes in one place.</span></div></li>
    </ol>
    <div className="visit-intro-assurance"><ShieldCheck size={19} aria-hidden="true" /><span>Private files. Saved drafts. <Check size={13} aria-hidden="true" /> All attached to your visit.</span></div>
    <Link href="/photographers/photo-guide">Review the photography guide <ArrowUpRight size={16} aria-hidden="true" /></Link>
  </aside>;
}
