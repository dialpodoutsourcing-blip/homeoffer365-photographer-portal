import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { GuestLanding } from "@/components/portal/guest-landing";

export const metadata: Metadata = { title: "Property Workspace | Home Offer 365" };

export default function UploadPage() {
  return <><PageHeading label="03 / PROPERTY VISITS" title="Every visit. All in one place." description="Use your private property link to save the checklist, upload your files, and submit your visit." /><GuestLanding /></>;
}
