import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const landingPath = new URL("../components/photographer-guide/photographer-landing.tsx", import.meta.url);
const demoOnePath = new URL("../app/page.tsx", import.meta.url);
const productionPath = new URL("../app/photographers/page.tsx", import.meta.url);
const demoOneAliasPath = new URL("../app/photographers/demo-1/page.tsx", import.meta.url);
const demoTwoPath = new URL("../app/photographers/demo-2/page.tsx", import.meta.url);
const demoThreePath = new URL("../app/photographers/demo-3/page.tsx", import.meta.url);
const demoFourPath = new URL("../app/photographers/demo-4/page.tsx", import.meta.url);
const demoFourLandingPath = new URL("../components/photographer-guide/photographer-demo-four.tsx", import.meta.url);
const demoFourSamplesPath = new URL("../components/photographer-guide/demo-four-samples.tsx", import.meta.url);
const stylesPath = new URL("../app/globals.css", import.meta.url);
const photoSliderPath = new URL("../components/photographer-guide/photo-slider.tsx", import.meta.url);
const submissionFormPath = new URL("../components/photographer-guide/submission-form.tsx", import.meta.url);
const guideContentPath = new URL("../content/photographer-guide.ts", import.meta.url);
const walkthroughVideoPath = new URL("../public/videos/mt-vernon-walkthrough.mp4", import.meta.url);
const demoThreeHeroPath = new URL("../public/images/photo-examples/equity-drive/demo-3-hero-enhanced.png", import.meta.url);
const demoFourHeroPath = new URL("../public/images/photo-examples/demo-4-photographer-hero.webp", import.meta.url);
const demoFourAvatarsPath = new URL("../public/images/review-avatars/demo-4-review-portraits.webp", import.meta.url);
const demoFourVideoPath = new URL("../public/videos/demo-4-property-tour.mp4", import.meta.url);

test("demo 3 presents the Home Offer 365 welcome without changing demo 2", async () => {
  const [landing, demoTwo, demoThree] = await Promise.all([
    readFile(landingPath, "utf8"),
    readFile(demoTwoPath, "utf8"),
    readFile(demoThreePath, "utf8"),
  ]);

  assert.match(demoThree, /<PhotographerLanding variant="demo3" \/>/);
  assert.match(landing, /Welcome to Home Offer 365/);
  assert.match(landing, /landing-demo-three/);
  assert.match(demoTwo, /<PhotographerLanding \/>/);
  assert.doesNotMatch(demoTwo, /variant="demo3"/);
});

test("demo 4 is a separate compact page with reviews, requested samples, and submission", async () => {
  const [demoThree, demoFour, demoFourLanding, demoFourSamples, form, styles] = await Promise.all([
    readFile(demoThreePath, "utf8"),
    readFile(demoFourPath, "utf8"),
    readFile(demoFourLandingPath, "utf8"),
    readFile(demoFourSamplesPath, "utf8"),
    readFile(submissionFormPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(demoFour, /<PhotographerDemoFour \/>/);
  assert.doesNotMatch(demoThree, /PhotographerDemoFour|demo-4/);
  assert.match(demoFourLanding, /Welcome to Home Offer 365/);
  assert.doesNotMatch(demoFourLanding, /demo-four-header/);
  assert.match(demoFourLanding, /<section className="demo-four-hero"[\s\S]*?className="demo-four-house-logo"/);
  assert.match(demoFourLanding, /demo-four-house-logo[\s\S]*?home-offer-365-logo\.png/);
  assert.match(styles, /\.demo-four-house-logo\s*\{[^}]+width:\s*42px[^}]+height:\s*42px[^}]+overflow:\s*hidden[^}]+background:\s*#fff/);
  assert.match(styles, /\.demo-four-house-logo img\s*\{[^}]+transform:\s*translate\(-3\.7px,\s*-0\.7px\)/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.demo-four-house-logo\s*\{[^}]+top:\s*18px[^}]+right:\s*20px/);
  assert.doesNotMatch(demoFourLanding, /Submit Photos\/Videos <ArrowRight/);
  assert.match(demoFourLanding, /demo-4-photographer-hero\.webp/);
  assert.match(demoFourLanding, /className="demo-four-hero-image"[\s\S]*?preload[\s\S]*?placeholder="blur"/);
  assert.match(demoFourLanding, /<a className="demo-four-team-strip"[^>]+>[\s\S]*?<span>Meet the team behind every visit\.<\/span>[\s\S]*?<ExternalLink/);
  assert.doesNotMatch(demoFourLanding, /Real people, ready to help|>Meet the Team </);
  assert.match(demoFourLanding, /VENDOR FEEDBACK/);
  assert.match(demoFourLanding, /Trusted by the vendors who work with us\./);
  assert.doesNotMatch(demoFourLanding, /5\.0 GOOGLE RATING|View Google Reviews|googleReviewsUrl/);
  assert.match(demoFourLanding, /View photos and video samples/i);
  assert.match(demoFourSamples, /galleryGroups/);
  assert.match(demoFourSamples, /Exterior:\s*\[[\s\S]*?equity-drive\/1\.jpg[\s\S]*?equity-drive\/16\.jpg[\s\S]*?equity-drive\/20\.jpg[\s\S]*?equity-drive\/21\.jpg[\s\S]*?\]/);
  assert.match(demoFourSamples, /Mechanicals:\s*\[[\s\S]*?equity-drive\/14\.jpg[\s\S]*?equity-drive\/19\.jpg[\s\S]*?\]/);
  assert.match(demoFourSamples, /demo-four-gallery-main/);
  assert.match(demoFourSamples, /demo-four-gallery-thumbnails/);
  assert.match(demoFourSamples, /aria-pressed=\{selectedIndex === index\}/);
  assert.match(demoFourSamples, /className="demo-four-street-view"><iframe/);
  assert.match(demoFourSamples, /Full Property Video Tour/);
  assert.match(demoFourSamples, /Living Room/);
  assert.match(demoFourSamples, /Kitchen/);
  assert.match(demoFourSamples, /Bathroom/);
  assert.match(demoFourSamples, /Mechanicals/);
  assert.match(demoFourLanding, /Photographer(?:&apos;|')s Info/);
  assert.match(demoFourLanding, /<DemoFourSamples \/>/);
  assert.match(demoFourLanding, /<SubmissionForm showChecklist=\{false\} \/>/);
  assert.doesNotMatch(demoFourLanding, /demo-four-floating-submit|<Camera/);
  assert.match(form, /showChecklist = true/);
  assert.doesNotMatch(demoFourLanding, /id="photo-checklist"/);
  assert.doesNotMatch(demoFourSamples, /target="_blank"|map_action=pano/);
  assert.match(demoFourLanding, /demo-4-review-portraits\.webp/);
  assert.deepEqual([...demoFourLanding.matchAll(/avatarPosition: "([^"]+)"/g)].map((match) => match[1]), ["0%", "25%", "50%", "75%", "100%"]);
  assert.equal([...demoFourLanding.matchAll(/rating: 5/g)].length, 5);
  assert.match(demoFourSamples, /"use client"/);
  assert.match(demoFourSamples, /role="tablist"/);
  assert.match(demoFourSamples, /Exterior/);
  assert.match(demoFourSamples, /Street View/);
  assert.match(demoFourSamples, /Video Tours/);
  assert.doesNotMatch(demoFourSamples, /"Videos"/);
  assert.match(demoFourSamples, /Interior/);
  assert.match(demoFourSamples, /Mechanicals/);
  assert.match(demoFourSamples, /demo-4-property-tour\.mp4/);
  assert.doesNotMatch(demoFourSamples, /interior-sample\.mp4|Interior Video Tour/);
  assert.match(styles, /\.photographer-demo-four/);
  assert.match(styles, /\.demo-four-review-avatar[^}]+background-size: 500% auto[^}]+background-position-y: center/);
  assert.doesNotMatch(styles, /\.demo-four-floating-submit/);
  assert.match(styles, /\.demo-four-gallery-main/);
  assert.match(styles, /\.demo-four-gallery-thumbnails/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.demo-four-samples/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.demo-four-hero-image[^}]+object-position: 88% center/);
  assert.doesNotMatch(styles, /\.demo-four-header nav a:first-child\s*\{\s*display:\s*none/);
  assert.match(styles, /\.demo-four-video\s*\{[^}]*display:\s*grid/);
  assert.match(styles, /\.demo-four-video\s*>\s*span\s*\{[^}]*position:\s*static/);
  assert.deepEqual([...demoFourLanding.matchAll(/name: "([^"]+)"/g)].map((match) => match[1]), ["Michael Davis", "Emily Carter", "Daniel Wilson", "Jessica Miller", "Sarah Thompson"]);
});

test("demo 4 uses lightweight hero and review imagery", async () => {
  const [heroImage, avatarImage, video] = await Promise.all([
    stat(demoFourHeroPath),
    stat(demoFourAvatarsPath),
    stat(demoFourVideoPath),
  ]);

  assert.ok(heroImage.size < 250_000, `hero image is ${heroImage.size} bytes`);
  assert.ok(avatarImage.size < 100_000, `avatar sprite is ${avatarImage.size} bytes`);
  assert.ok(video.size > 1_000_000 && video.size < 40_000_000, `video is ${video.size} bytes`);
});

test("demo 3 uses its own enhanced local hero image", async () => {
  const [styles, heroImage] = await Promise.all([
    readFile(stylesPath, "utf8"),
    stat(demoThreeHeroPath),
  ]);

  assert.match(styles, /\.landing-demo-three \.landing-hero[^}]+demo-3-hero-enhanced\.png/s);
  assert.ok(heroImage.size > 100_000);
});

test("demo 3 uses a responsive background hero with left-aligned overlay content", async () => {
  const [landing, styles] = await Promise.all([
    readFile(landingPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(landing, /landing-hero-background/);
  assert.match(styles, /\.landing-demo-three \.landing-hero-background[^}]+grid-template-columns: 1fr[^}]+demo-3-hero-enhanced\.png/s);
  assert.match(styles, /\.landing-demo-three \.landing-hero-copy[^}]+z-index: 2[^}]+background: transparent/s);
  assert.match(styles, /\.landing-demo-three \.landing-hero-background h1[^}]+color: white/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.landing-demo-three \.landing-hero-background[^}]+linear-gradient/s);
});

test("demo 3 places the team directly after four resource cards", async () => {
  const landing = await readFile(landingPath, "utf8");
  const resourceConfig = landing.match(/const resources = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
  const labels = [...resourceConfig.matchAll(/label: "([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(labels, ["Meet Our Team", "Google Reviews", "Photo and Video Samples", "Submit Photos"]);
  assert.match(landing, /<\/nav>\s*\{isDemoThree && teamSection\}/);
  assert.match(landing, /\{!isDemoThree && teamSection\}/);
});

test("demo 3 places homeowner reviews directly after the team", async () => {
  const landing = await readFile(landingPath, "utf8");

  assert.match(landing, /\{isDemoThree && teamSection\}\s*\{isDemoThree && reviewsSection\}\s*<section id="photo-samples"/);
  assert.match(landing, /\{!isDemoThree && teamSection\}\s*\{!isDemoThree && reviewsSection\}\s*<SubmissionForm/);
});

test("photo checklist uses compact collapsible rows", async () => {
  const [landing, styles] = await Promise.all([
    readFile(landingPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);
  const checklist = landing.match(/<section id="photo-checklist"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(checklist, /Open a category for a quick reminder before you leave\./);
  assert.match(checklist, /<details className="landing-checklist"[^>]*open=\{index === 0\}>/);
  assert.match(checklist, /<summary><strong>\{group\.title\}<\/strong><\/summary>/);
  assert.doesNotMatch(checklist, /String\(index \+ 1\)|group\.items\.length|<small>/);
  assert.match(styles, /\.landing-checklist-grid \{[^}]*grid-template-columns: 1fr/);
  assert.match(styles, /\.landing-checklist summary \{[^}]*grid-template-columns: 1fr auto/);
});

test("photographers landing page presents every requested resource without a database flow", async () => {
  const [landing, demoOne, production, demoOneAlias, demoTwo, styles] = await Promise.all([
    readFile(landingPath, "utf8"),
    readFile(demoOnePath, "utf8"),
    readFile(productionPath, "utf8"),
    readFile(demoOneAliasPath, "utf8"),
    readFile(demoTwoPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(demoOne, /PhotographerLanding/);
  assert.match(production, /PhotographerLanding/);
  assert.match(production, /landing-demo-standalone/);
  assert.match(demoOneAlias, /Welcome/);
  assert.match(demoOneAlias, /GuideSteps/);
  assert.match(demoOneAlias, /Resources/);
  assert.doesNotMatch(demoOneAlias, /default.*\.\.\/\.\.\/page/);
  assert.match(demoTwo, /PhotographerLanding/);
  assert.match(demoTwo, /landing-demo-standalone/);
  assert.match(landing, /Welcome, Photographers!/);
  assert.match(landing, /Meet Our Team/);
  assert.match(landing, /Google Reviews/);
  assert.match(landing, /Photo and Video Samples/);
  assert.match(landing, /id="video-samples"/);
  assert.match(landing, /id="photo-checklist"/);
  assert.match(landing, /Submit Photos/);
  const resourceConfig = landing.match(/const resources = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
  assert.equal([...resourceConfig.matchAll(/label:/g)].length, 4);
  assert.match(resourceConfig, /label: "Photo and Video Samples"/);
  assert.doesNotMatch(resourceConfig, /label: "Photo Checklist"/);
  assert.match(landing, /className=\{label === "Submit Photos" \? "landing-resource-submit"/);
  assert.match(styles, /\.landing-resource-grid[^}]*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.landing-resource-submit/);
  assert.match(landing, /<details[^>]*className="landing-checklist"/);
  assert.match(landing, /<ul/);
  assert.doesNotMatch(landing, /type="checkbox"/);
  assert.doesNotMatch(landing, /supabase|database/i);
  assert.doesNotMatch(landing, /href="\/photographers/);
  assert.match(landing, /mailto:info@homeoffer365\.com/);
});

test("photographers landing page has scoped responsive presentation hooks", async () => {
  const [landing, styles] = await Promise.all([
    readFile(landingPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(landing, /"photographer-landing"/);
  assert.match(landing, /id="photo-samples"/);
  assert.match(landing, /id="video-samples"/);
  assert.match(landing, /id="photo-checklist"/);
  assert.match(landing, /<SubmissionForm \/>/);
  assert.match(landing, /landing-site-header/);
  assert.match(landing, /landing-site-footer/);
  assert.match(landing, /Selling to us\?/);
  assert.match(landing, /Homeowner Portal/);
  assert.match(landing, /Track Your Sale/);
  assert.match(landing, /Get a Cash Offer/);
  assert.match(landing, /Quick Links/);
  assert.match(landing, /Privacy Policy/);
  assert.match(landing, /Terms of Service/);
  assert.match(landing, /className="landing-submit-tab"/);
  assert.doesNotMatch(landing, /className="landing-mobile-submit"/);
  assert.match(landing, /className="landing-submit-tab"[^>]*>[\s\S]*?<Camera/);
  assert.match(landing, /href="#submit-photos"/);
  assert.match(landing, /href="#meet-team">Team/);
  assert.match(landing, /className="landing-team-card"/);
  assert.match(styles, /\.photographer-landing/);
  assert.match(styles, /\.portal:has\(\.landing-demo-standalone\) \.sidebar/);
  assert.match(styles, /\.portal:has\(\.landing-demo-standalone\) \.workspace/);
  assert.match(styles, /\.photographer-landing > :not\(\.landing-site-header\):not\(\.landing-site-footer\) \{ width: min\(1152px, calc\(100% - 48px\)\)/);
  assert.match(styles, /\.landing-submit-tab[^}]*width: 52px !important/);
  assert.match(styles, /\.landing-submit-tab[^}]*min-height: 174px/);
  assert.match(styles, /\.landing-submit-tab::before[^}]*background: #f47a2a/);
  assert.match(styles, /\.landing-submit-tab[^}]*grid-template-rows: auto 1fr/);
  assert.match(styles, /\.landing-submit-tab[^}]*transform: translateY\(-50%\)/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.landing-submit-tab[^}]*grid-template-rows: none/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.landing-submit-tab \{[^}]*display: grid[^}]*width: 44px !important[^}]*transform: translateY\(-50%\)/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.landing-submit-tab-label \{[^}]*writing-mode: vertical-rl/);
  assert.match(styles, /\.landing-team-card::before[^}]*background: #f47a2a/);
  assert.match(styles, /\.landing-team-card:hover[^}]*translateY\(-5px\)/);
  assert.match(styles, /\.landing-team-card img[^}]*width: 88px/);
  assert.match(styles, /@media \(max-width: 430px\)[\s\S]*?\.landing-hero h1 \{[^}]*overflow-wrap: anywhere/);
  assert.match(styles, /@media \(max-width: 430px\)[\s\S]*?\.landing-demo-three \.landing-hero-background h1 \{[^}]*font-size: clamp\(38px, 11vw, 46px\)/);
  assert.match(styles, /@media \(max-width: 430px\)[\s\S]*?\.landing-cash-cta \{[^}]*padding-inline: 10px[^}]*font-size: 11px/);
});

test("photo samples use a keyboard-accessible slider with every supplied Drive photo", async () => {
  const [landing, slider, styles] = await Promise.all([
    readFile(landingPath, "utf8"),
    readFile(photoSliderPath, "utf8"),
    readFile(stylesPath, "utf8"),
  ]);

  assert.match(landing, /<PhotoSlider \/>/);
  assert.match(slider, /"use client"/);
  assert.match(slider, /Previous photos/);
  assert.match(slider, /Next photos/);
  assert.match(slider, /aria-live="polite"/);
  assert.match(slider, /role="dialog"/);
  assert.match(slider, /aria-modal="true"/);
  assert.match(slider, /Close enlarged photo/);
  assert.match(slider, /event\.target === event\.currentTarget/);
  assert.match(slider, /event\.key === "Escape"/);
  assert.match(slider, /event\.key === "ArrowLeft"/);
  assert.match(slider, /event\.key === "ArrowRight"/);
  assert.match(styles, /\.photo-lightbox \{/);
  assert.match(styles, /\.landing-submit-tab-icon/);
  const drivePhotos = [...slider.matchAll(/equity-drive\/(\d+)\.jpg/g)].map((match) => Number(match[1]));
  assert.deepEqual(drivePhotos, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22]);
});

test("video samples use the supplied Mt. Vernon walkthrough", async () => {
  const [guide, video] = await Promise.all([
    readFile(guideContentPath, "utf8"),
    stat(walkthroughVideoPath),
  ]);

  assert.match(guide, /walkthrough: "\/videos\/mt-vernon-walkthrough\.mp4"/);
  assert.ok(video.size > 80_000_000);
});

test("landing submission is a database-free form with an honest confirmation state", async () => {
  const [landing, form] = await Promise.all([
    readFile(landingPath, "utf8"),
    readFile(submissionFormPath, "utf8"),
  ]);

  assert.match(landing, /<SubmissionForm \/>/);
  assert.match(form, /name="photographerName"/);
  assert.match(form, /name="email"/);
  assert.match(form, /name="phone"/);
  assert.match(form, /name="propertyAddress"/);
  assert.match(form, /name="driveLink"/);
  assert.match(form, /name="checklistComplete"/);
  assert.equal([...form.matchAll(/data-lpignore="true"/g)].length, 5);
  assert.equal([...form.matchAll(/suppressHydrationWarning/g)].length, 10);
  assert.match(form, /type="checkbox"/);
  assert.match(form, /Did you complete the photo checklist\?/);
  assert.match(form, /href="#photo-checklist"/);
  assert.match(form, /id="submit-photos"/);
  assert.match(form, /type="submit"/);
  assert.match(form, /We have received your photos/);
  assert.match(form, /receive an email with the review result/);
  assert.doesNotMatch(form, /fetch\(|supabase|database/i);
});
