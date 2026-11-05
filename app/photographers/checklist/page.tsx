import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { Checklist } from "@/components/photographer-guide/checklist";

export const metadata: Metadata = { title: "Visit Checklist | Home Offer 365" };

export default function ChecklistPage() {
  return <><PageHeading label="02 / VISIT CHECKLIST" title="Every detail, double-checked." description="Review all 19 items across exterior, interior, mechanical systems, video, and final submission." /><div className="dedicated-checklist"><Checklist /></div></>;
}
