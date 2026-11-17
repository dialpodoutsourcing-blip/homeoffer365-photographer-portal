import type { Metadata } from "next";
import { HomeownersPage } from "@/components/photographer-guide/homeowners-page";

export const metadata: Metadata = {
  title: "Homeowners | Home Offer 365",
  description: "A concise photo, video, and submission guide for Home Offer 365 homeowners.",
};

export default function HomeownersRoute() {
  return <div className="landing-demo-standalone"><HomeownersPage /></div>;
}
