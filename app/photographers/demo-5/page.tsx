import type { Metadata } from "next";
import { PhotographerDemoFive } from "@/components/photographer-guide/photographer-demo-five";

export const metadata: Metadata = {
  title: "Welcome to Home Offer 365 | Photographer Demo 5",
  description: "A concise photo, video, and submission guide for Home Offer 365 photographers.",
};

export default function PhotographerDemoFivePage() {
  return <div className="landing-demo-standalone"><PhotographerDemoFive /></div>;
}
