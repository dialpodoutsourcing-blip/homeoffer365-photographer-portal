import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/layout/page-heading";
import { PhotoGuide } from "@/components/photographer-guide/photo-guide";

export const metadata: Metadata = { title: "Photo & Video Guide | Home Offer 365" };

export default function PhotoGuidePage() {
  return <><PageHeading label="01 / PHOTO & VIDEO GUIDE" title="Know what to capture." description="Review all four categories and the walkthrough example before your appointment." /><div className="dedicated-guide"><PhotoGuide /></div><div className="page-next"><Link className="button primary" href="/photographers/checklist">Continue to your checklist →</Link></div></>;
}
