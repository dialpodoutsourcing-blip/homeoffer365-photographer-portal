import Image from "next/image";
import { ArrowRight, Camera, ExternalLink, House, Star, Users } from "lucide-react";
import demoFourHero from "@/public/images/photo-examples/demo-4-photographer-hero.webp";
import { DemoFourSamples } from "./demo-four-samples";
import { SubmissionForm } from "./submission-form";

const googleReviewsUrl = "https://www.google.com/maps/search/?api=1&query=Home+Offer+365+Lebanon+PA";

const reviews = [
  {
    name: "Shadab Khan",
    avatarPosition: "0%",
    rating: 5,
    quote: "The team was professional, knowledgeable, and incredibly efficient from start to finish.",
  },
  {
    name: "Ziyad T",
    avatarPosition: "25%",
    rating: 5,
    quote: "Honesty, integrity, and a willingness to go the extra mile. The team was friendly and helpful.",
  },
  {
    name: "Asha Caraballo",
    avatarPosition: "50%",
    rating: 5,
    quote: "Such a great experience—friendly, helpful, and knowledgeable about what needed to be done.",
  },
  {
    name: "Carlos Courtney",
    avatarPosition: "75%",
    rating: 5,
    quote: "Great service. I recommend them to anyone looking to sell their house fast.",
  },
  {
    name: "Jason James",
    avatarPosition: "100%",
    rating: 5,
    quote: "Great service, and I recommend this team.",
  },
] as const;

export function PhotographerDemoFour() {
  return (
    <div className="photographer-demo-four">
      <header className="demo-four-header">
        <a className="demo-four-house-logo" href="https://homeoffer365.com/" aria-label="Home Offer 365 home page">
          <Image src="/images/brand/home-offer-365-logo.png" alt="" width={768} height={296} priority />
        </a>
      </header>

      <section className="demo-four-hero" aria-labelledby="demo-four-title">
        <Image className="demo-four-hero-image" src={demoFourHero} alt="" fill preload placeholder="blur" sizes="(max-width: 760px) 100vw, 1400px" />
        <div>
          <span className="eyebrow"><House size={15} aria-hidden="true" /> PHOTOGRAPHER PORTAL</span>
          <h1 id="demo-four-title">Welcome to Home Offer 365</h1>
          <p>Everything you need to capture the property and send your files—kept simple.</p>
        </div>
        <a className="button primary" href="#submit-photos">Submit Photos/Videos <ArrowRight size={16} aria-hidden="true" /></a>
      </section>
      <section className="demo-four-team-strip" aria-label="Meet the Home Offer 365 team">
        <span className="demo-four-team-icon"><Users size={18} aria-hidden="true" /></span>
        <div><h2>Meet the team behind every visit.</h2><p>Real people, ready to help.</p></div>
        <a href="https://homeoffer365.com/team" target="_blank" rel="noopener noreferrer">Meet the Team <ExternalLink size={13} aria-hidden="true" /></a>
      </section>

      <section className="demo-four-reviews" aria-labelledby="demo-four-reviews-title">
        <div className="demo-four-section-title">
          <div><span className="eyebrow">5.0 GOOGLE RATING</span><h2 id="demo-four-reviews-title">Reviews from our vendors.</h2></div>
          <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer">View Google Reviews <ExternalLink size={14} aria-hidden="true" /></a>
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
      <a className="demo-four-floating-submit" href="#submit-photos" aria-label="Submit photos and videos"><Camera size={20} strokeWidth={2.2} aria-hidden="true" /></a>
    </div>
  );
}
