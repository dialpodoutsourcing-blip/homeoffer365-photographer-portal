import Image from "next/image";
import { Camera, Check, ChevronDown, ShieldCheck, Video } from "lucide-react";
import { exteriorExamples, photoCategories, walkthroughSample } from "@/content/photographer-guide";
import { PhotoExample } from "./photo-example";

export function PhotoGuide() {
  return (
    <section id="photo-guide" className="panel photo-guide">
      <div className="section-heading">
        <span className="section-icon"><Camera size={22} aria-hidden="true" /></span>
        <div><span className="eyebrow">KNOW WHAT TO CAPTURE</span><h2>Photography & video guide</h2></div>
      </div>
      <p className="section-description">Four areas to cover. One complete picture of the property.</p>
      <div className="photo-grid">
        {photoCategories.map((category) => (
          <article className="photo-card" key={category.id}>
            <div className={`category-image category-${category.id}`}>
              <Image src={category.image} alt={category.alt} width={1200} height={896} sizes="(max-width: 430px) 43vw, (max-width: 760px) 45vw, (max-width: 1000px) 34vw, 25vw" />
              <span className="category-number">{category.number}</span>
            </div>
            <div className="photo-card-copy">
              <h3>{category.title}</h3>
              <ul className="highlights">{category.highlights.map((item) => <li key={item}><Check size={15} aria-hidden="true" />{item}</li>)}</ul>
              <PhotoExample title={category.title} src={category.image} alt={category.alt} note={category.exampleNote} examples={category.id === "exterior" ? exteriorExamples : undefined} />
              <details>
                <summary>View shot list <ChevronDown size={15} aria-hidden="true" /></summary>
                <div className="shot-details">
                  <ul>{category.shots.map((shot) => <li key={shot}>{shot}</li>)}</ul>
                  <p className="shot-tip">{category.tip}</p>
                </div>
              </details>
            </div>
          </article>
        ))}
      </div>
      <p className="image-note">These examples show framing and coverage, not actual inspected properties or verified equipment installations.</p>
      <section id="walkthrough" className="video-card walkthrough-card" aria-labelledby="video-heading">
        <div className="walkthrough-heading">
          <Video size={26} aria-hidden="true" />
          <div><span className="eyebrow">LET THE LAYOUT TELL THE STORY</span><h3 id="video-heading">Property walkthrough video</h3></div>
        </div>
        <p>Record the home’s layout, overall condition, and visible issues. Move slowly and include every accessible room.</p>
        <video controls playsInline muted preload="none" poster={walkthroughSample.poster} width={3840} height={2160} aria-label="Illustrative interior video sample" aria-describedby="video-description">
          <source src={walkthroughSample.src} type="video/mp4" />
          Your browser does not support embedded video. <a href={walkthroughSample.src}>Open the sample video</a>.
        </video>
        <p className="video-sample-label">ILLUSTRATIVE INTERIOR CLIP · 12 SECONDS</p>
        <p id="video-description">{walkthroughSample.description}</p>
        <a className="resource-link" href={walkthroughSample.src} target="_blank" rel="noopener noreferrer">Open video in a new tab<span className="sr-only"> (MP4)</span></a>
      </section>
      <div className="safety-note"><ShieldCheck size={20} aria-hidden="true" /><p><strong>Capture with care.</strong> Stay in safe, accessible areas. Report anything you cannot access. Document visible conditions without diagnosing them.</p></div>
    </section>
  );
}
