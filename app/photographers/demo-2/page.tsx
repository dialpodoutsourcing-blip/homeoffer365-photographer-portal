import type { Metadata } from "next";
import { PhotographerLanding } from "@/components/photographer-guide/photographer-landing";

export const metadata: Metadata = {
  title: "Photographer Landing Page Demo | Home Offer 365",
  description: "A landing-page concept for Home Offer 365 photographers.",
};

export default function PhotographerLandingDemoPage() {
  return <div className="landing-demo-standalone"><PhotographerLanding /></div>;
}
