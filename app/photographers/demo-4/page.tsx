import type { Metadata } from "next";
import { PhotographerDemoFour } from "@/components/photographer-guide/photographer-demo-four";

export const metadata: Metadata = {
  title: "Welcome to Home Offer 365 | Photographer Demo 4",
  description: "A concise photo, video, and submission guide for Home Offer 365 photographers.",
};

export default function PhotographerDemoFourPage() {
  return <div className="landing-demo-standalone"><PhotographerDemoFour /></div>;
}
