import type { Metadata } from "next";
import { PhotographerLanding } from "@/components/photographer-guide/photographer-landing";

export const metadata: Metadata = {
  title: "Welcome to Home Offer 365 | Photographer Demo",
  description: "A Home Offer 365 landing-page concept for property photographers.",
};

export default function PhotographerLandingDemoThreePage() {
  return <div className="landing-demo-standalone"><PhotographerLanding variant="demo3" /></div>;
}
