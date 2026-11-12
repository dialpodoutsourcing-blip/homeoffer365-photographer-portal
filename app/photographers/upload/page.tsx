import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { GuestLanding } from "@/components/portal/guest-landing";

export const metadata: Metadata = { title: "Property Workspace | Home Offer 365" };

export default function UploadPage() {
  return <><PageHeading label="03 / PROPERTY VISITS" title="Every visit. All in one place." description="Select a property, share its Google Drive folder, and review your submission." /><GuestLanding /></>;
}
