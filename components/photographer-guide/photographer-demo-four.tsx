import Image from "next/image";
import { ExternalLink, House, Star, Users } from "lucide-react";
import demoFourHero from "@/public/images/photo-examples/demo-4-photographer-hero.webp";
import { DemoFourSamples } from "./demo-four-samples";
import { SubmissionForm } from "./submission-form";

const reviews = [
  {
    name: "Michael Davis",
    avatarPosition: "0%",
    rating: 5,
    quote: "The team was professional, knowledgeable, and incredibly efficient from start to finish.",
  },
  {
    name: "Emily Carter",
    avatarPosition: "25%",
    rating: 5,
    quote: "Honesty, integrity, and a willingness to go the extra mile. The team was friendly and helpful.",
  },
  {
    name: "Daniel Wilson",
    avatarPosition: "50%",
    rating: 5,
    quote: "Such a great experience—friendly, helpful, and knowledgeable about what needed to be done.",
  },
  {
    name: "Jessica Miller",
    avatarPosition: "75%",
    rating: 5,
    quote: "Great service. I recommend them to anyone looking to sell their house fast.",
  },
  {
    name: "Sarah Thompson",
    avatarPosition: "100%",
    rating: 5,
    quote: "Great service, and I recommend this team.",
  },
] as const;

export function PhotographerDemoFour() {
  return (
    <div className="photographer-demo-four">
      <section className="demo-four-hero" aria-labelledby="demo-four-title">
        <Image className="demo-four-hero-image" src={demoFourHero} alt="" fill preload placeholder="blur" sizes="(max-width: 760px) 100vw, 1400px" />
        <a className="demo-four-house-logo" href="https://homeoffer365.com/" aria-label="Home Offer 365 home page">
          <Image src="/images/brand/guide-mark.svg" alt="" width={64} height={64} />
        </a>
        <div>
          <span className="eyebrow"><House size={15} aria-hidden="true" /> PHOTOGRAPHER PORTAL</span>
          <h1 id="demo-four-title">Welcome to Home Offer 365</h1>
          <p>Everything you need to capture the property and send your files—kept simple.</p>
        </div>
      </section>
      <a className="demo-four-team-strip" href="https://homeoffer365.com/team" target="_blank" rel="noopener noreferrer">
        <span className="demo-four-team-icon"><Users size={18} aria-hidden="true" /></span>
        <span>Meet the team behind every visit.</span>
        <ExternalLink size={14} aria-hidden="true" />
      </a>

      <section className="demo-four-reviews" aria-labelledby="demo-four-reviews-title">
        <div className="demo-four-section-title">
          <div><span className="eyebrow">VENDOR FEEDBACK</span><h2 id="demo-four-reviews-title">Trusted by the vendors who work with us.</h2></div>
        </div>
        <div className="demo-four-review-strip">
          {reviews.map((review) => (
            <article className="demo-four-review" key={review.name}>
              <div className="demo-four-review-person">
                <span className="demo-four-review-avatar" role="img" aria-label={`${review.name} avatar`} style={{ backgroundImage: "url('/images/review-avatars/demo-4-review-portraits.webp')", backgroundPosition: review.avatarPosition }} />
                <div><strong>{review.name}</strong><span aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: review.rating }, (_, index) => <Star key={index} size={12} fill="currentColor" aria-hidden="true" />)}</span></div>
              </div>
              <p>“{review.quote}”</p>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-four-samples" aria-labelledby="demo-four-samples-title">
        <div className="demo-four-section-title">
          <div><span className="eyebrow">QUICK REFERENCE</span><h2 id="demo-four-samples-title">View photos and video samples.</h2></div>
          <p>Keep shots wide, level, well lit, and complete.</p>
        </div>
        <DemoFourSamples />
      </section>

      <section className="demo-four-form" aria-labelledby="demo-four-form-title">
        <div className="demo-four-form-heading"><span className="eyebrow">SUBMIT PHOTOS/VIDEOS</span><h2 id="demo-four-form-title">Photographer&apos;s Info</h2></div>
        <SubmissionForm showChecklist={false} />
      </section>
    </div>
  );
}
