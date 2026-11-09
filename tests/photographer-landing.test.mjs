import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const landingPath = new URL("../components/photographer-guide/photographer-landing.tsx", import.meta.url);
const demoOnePath = new URL("../app/page.tsx", import.meta.url);
const productionPath = new URL("../app/photographers/page.tsx", import.meta.url);
const demoOneAliasPath = new URL("../app/photographers/demo-1/page.tsx", import.meta.url);
const demoTwoPath = new URL("../app/photographers/demo-2/page.tsx", import.meta.url);
const demoThreePath = new URL("../app/photographers/demo-3/page.tsx", import.meta.url);
const stylesPath = new URL("../app/globals.css", import.meta.url);
const photoSliderPath = new URL("../components/photographer-guide/photo-slider.tsx", import.meta.url);
const submissionFormPath = new URL("../components/photographer-guide/submission-form.tsx", import.meta.url);
const guideContentPath = new URL("../content/photographer-guide.ts", import.meta.url);
const walkthroughVideoPath = new URL("../public/videos/mt-vernon-walkthrough.mp4", import.meta.url);
const demoThreeHeroPath = new URL("../public/images/photo-examples/equity-drive/demo-3-hero-enhanced.png", import.meta.url);

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
