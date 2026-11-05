import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { PortalWorkspace } from "@/components/portal/portal-workspace";

export const metadata: Metadata = { title: "Staff Workspace | Home Offer 365", robots: { index: false, follow: false } };

export default function StaffPage() {
  return <><div className="staff-return"><Link href="/photographers/upload" className="button secondary"><ArrowLeft size={16} aria-hidden="true" />Back to Property Visits</Link></div><PageHeading label="STAFF WORKSPACE" title="Manage your property visits." description="Create visits, share private photographer links, and review the details in one place." /><PortalWorkspace /></>;
}
