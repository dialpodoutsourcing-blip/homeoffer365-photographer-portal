import type { Metadata } from "next";
import "./globals.css";
import { PortalShell } from "@/components/layout/portal-shell";
import { ChecklistProvider } from "@/components/photographer-guide/checklist-state";

export const metadata: Metadata = {
  icons: { icon: "/images/brand/guide-mark.svg" },
  title: "Photographer Guide | Home Offer 365",
  description: "Your Home Offer 365 field guide: property photography, walkthrough video, visit checklist, and submission resources. People Over Profit.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
    >
      <body><ChecklistProvider><PortalShell>{children}</PortalShell></ChecklistProvider></body>
    </html>
  );
}
