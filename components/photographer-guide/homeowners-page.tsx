import Image from "next/image";
import { House } from "lucide-react";
import homeownersHero from "@/public/images/photo-examples/pennsylvania-brick-bungalow/exterior-front-left-curb.webp";
import { DemoFiveSubmissionForm } from "./demo-five-submission-form";
import { validStorageOrigin } from "@/lib/demo-five/upload-photo-draft";

export function HomeownersPage() {
  return (
    <div className="photographer-demo-four homeowners-page">
      <section className="homeowners-hero" aria-labelledby="homeowners-title">
        <Image className="homeowners-hero-image" src={homeownersHero} alt="" fill preload placeholder="blur" sizes="(max-width: 760px) 100vw, 1280px" />
        <a className="demo-four-house-logo" href="https://homeoffer365.com/" aria-label="Home Offer 365 home page">
          <Image src="/images/brand/home-offer-365-logo.png" alt="" width={768} height={296} />
        </a>
        <div className="homeowners-hero-copy">
          <span className="eyebrow"><House size={15} aria-hidden="true" /> HOMEOWNER PHOTO PORTAL</span>
          <h1 id="homeowners-title">Share Your Property Photos</h1>
          <p>Upload clear photos of your home so our team can review the property and keep your sale moving.</p>
        </div>
      </section>
      <DemoFiveSubmissionForm storageOrigin={validStorageOrigin(process.env.SUPABASE_URL)} />
    </div>
  );
}
