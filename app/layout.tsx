import type { Metadata } from "next";
import "./globals.css";
import { PortalShell } from "@/components/layout/portal-shell";
import { ChecklistProvider } from "@/components/photographer-guide/checklist-state";

export const metadata: Metadata = {
  metadataBase: new URL("https://photographer.homeoffer365.com"),
  title: "Welcome to Home Offer 365 | Photographer Demo 4",
  description: "A concise photo, video, and submission guide for Home Offer 365 photographers.",
  openGraph: {
    title: "Welcome to Home Offer 365 | Photographer Demo 4",
    description: "A concise photo, video, and submission guide for Home Offer 365 photographers.",
    type: "website",
    siteName: "Home Offer 365",
  },
  twitter: {
    card: "summary_large_image",
    title: "Welcome to Home Offer 365 | Photographer Demo 4",
    description: "A concise photo, video, and submission guide for Home Offer 365 photographers.",
  },
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
