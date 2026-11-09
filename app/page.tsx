import type { Metadata } from "next";
import { PhotographerLanding } from "@/components/photographer-guide/photographer-landing";

export const metadata: Metadata = {
  title: "Photographers | Home Offer 365",
  description: "Home Offer 365 photography and video resources, examples, checklist, and submission guidance.",
};

export default function Home() {
  return <div className="landing-demo-standalone"><PhotographerLanding /></div>;
}
