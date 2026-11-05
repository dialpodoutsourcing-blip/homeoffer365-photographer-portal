import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/layout/page-heading";
import { HelpSection } from "@/components/photographer-guide/help-section";

export const metadata: Metadata = { title: "Photographer Help | Home Offer 365" };

export default function HelpPage() {
  return <><PageHeading label="FIELD SUPPORT" title="A little guidance when you need it." description="Contact your assigned team member with questions before or during your appointment." /><div className="submission-layout help-layout"><section className="panel help-questions"><h2>Common visit questions</h2><details open><summary>What if an area is inaccessible?</summary><p>Report the missing area and why you could not access it. Stay in safe, accessible locations rather than trying to enter an unsafe area.</p></details><details><summary>How should I document visible damage?</summary><p>Take a wide view to show its location, followed by a closer detail. Describe what is visible without diagnosing its cause.</p></details><details><summary>What should the walkthrough include?</summary><p>Show the layout, every accessible room, overall condition, and major visible issues. Move slowly and keep the camera steady.</p></details><details><summary>How should I organize the submission?</summary><p>Open the private property link supplied by your team, confirm the address, and upload each file to its category. Complete the saved visit checklist, explain unavailable areas in the notes, and choose Submit visit for a receipt.</p></details><Link className="resource-link" href="/photographers/photo-guide">Return to the photo guide →</Link></section><HelpSection /></div></>;
}
