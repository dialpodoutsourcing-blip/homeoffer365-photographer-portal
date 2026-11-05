import type { Metadata } from "next";
import { Suspense } from "react";
import { GuestVisit } from "@/components/portal/guest-visit";
import { PageHeading } from "@/components/layout/page-heading";

export const metadata: Metadata = { title: "Private Property Visit | Home Offer 365", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function VisitPage({ params }: PageProps<"/photographers/visit/[id]">) {
  return <><PageHeading label="PRIVATE PROPERTY VISIT" title="Capture the details. Share with care." description="Your checklist, photos, video, and notes stay together with the assigned property." /><Suspense fallback={<p role="status">Opening property visit…</p>}><VisitContent params={params} /></Suspense></>;
}

async function VisitContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GuestVisit key={id} visitId={id} />;
}
