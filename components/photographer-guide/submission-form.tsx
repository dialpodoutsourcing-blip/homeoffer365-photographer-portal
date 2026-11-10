"use client";

import { ArrowRight, CheckCircle2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

export function SubmissionForm({ showChecklist = true }: { showChecklist?: boolean } = {}) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const driveLink = String(new FormData(event.currentTarget).get("driveLink") ?? "");
    try {
      const url = new URL(driveLink);
      if (url.protocol !== "https:" || !["drive.google.com", "docs.google.com"].includes(url.hostname)) throw new Error();
    } catch {
      setError("Enter a valid Google Drive sharing link.");
      return;
    }
    setError("");
    setSubmitted(true);
  }

  if (submitted) return <section id="submit-photos" className="landing-submit landing-submission-confirmation" aria-labelledby="submission-confirmation-title"><span className="landing-submit-icon"><CheckCircle2 size={28} aria-hidden="true" /></span><div><span className="eyebrow">SUBMISSION RECEIVED</span><h2 id="submission-confirmation-title">We have received your photos.</h2><p>Our team will review your photos and video. You will receive an email with the review result.</p><small>Demo confirmation only—this form is not connected to a submission service yet.</small></div></section>;

  return <section id="submit-photos" className="landing-submit landing-submission-form" aria-labelledby="submit-title">
    <div className="landing-submit-intro"><span className="landing-submit-icon"><Send size={26} aria-hidden="true" /></span><div><span className="eyebrow">FINISHED YOUR VISIT?</span><h2 id="submit-title">Submit your photos and video.</h2><p>Share your contact details, the property address, and the Google Drive folder containing your completed files.</p></div></div>
    <form onSubmit={submit}>
      <div className="landing-form-grid">
        <label suppressHydrationWarning>Photographer&apos;s Name<input suppressHydrationWarning data-lpignore="true" data-1p-ignore type="text" name="photographerName" autoComplete="name" required /></label>
        <label suppressHydrationWarning>Email<input suppressHydrationWarning data-lpignore="true" data-1p-ignore type="email" name="email" autoComplete="email" required /></label>
        <label suppressHydrationWarning>Phone<input suppressHydrationWarning data-lpignore="true" data-1p-ignore type="tel" name="phone" autoComplete="tel" required /></label>
        <label suppressHydrationWarning>Property Address<input suppressHydrationWarning data-lpignore="true" data-1p-ignore type="text" name="propertyAddress" autoComplete="street-address" required /></label>
        <label className="landing-drive-field" suppressHydrationWarning>Google Drive Link<input suppressHydrationWarning data-lpignore="true" data-1p-ignore type="url" name="driveLink" inputMode="url" autoComplete="url" placeholder="https://drive.google.com/drive/folders/..." required /></label>
      </div>
      {showChecklist && <div className="landing-checklist-confirm"><input id="checklist-complete" type="checkbox" name="checklistComplete" required /><label htmlFor="checklist-complete">Did you complete the photo checklist?</label><a href="#photo-checklist">Review the checklist</a></div>}
      {error && <p className="landing-form-error" role="alert">{error}</p>}
      <div className="landing-form-submit"><small>Demo only—nothing will be sent or saved yet.</small><button className="button primary" type="submit">Submit Photos <ArrowRight size={17} aria-hidden="true" /></button></div>
    </form>
  </section>;
}
