"use client";

import { ArrowRight, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SubmissionConfirmation } from "./submission-confirmation";

export function SubmissionForm({ showChecklist = true }: { showChecklist?: boolean } = {}) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function closeConfirmation() {
    setSubmitted(false);
    window.requestAnimationFrame(() => document.querySelector<HTMLInputElement>('input[name="photographerName"]')?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const formData = new FormData(event.currentTarget);
    const driveLink = String(formData.get("driveLink") ?? "").trim();
    try {
      const url = new URL(driveLink);
      if (url.protocol !== "https:" || !["drive.google.com", "docs.google.com"].includes(url.hostname) || url.username || url.password) throw new Error();
    } catch {
      setError("Enter a valid Google Drive sharing link.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          photographerName: String(formData.get("photographerName") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          propertyAddress: String(formData.get("propertyAddress") ?? ""),
          driveLink,
          checklistComplete: formData.get("checklistComplete") === "on",
        }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || "We could not save your submission. Please try again.");
      setSubmitted(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We could not save your submission. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) return <SubmissionConfirmation onClose={closeConfirmation} />;

  return <section id="submit-photos" className="landing-submit landing-submission-form" aria-labelledby="submit-title">
    <div className="landing-submit-intro"><span className="landing-submit-icon"><Send size={26} aria-hidden="true" /></span><div><span className="eyebrow">FINISHED YOUR VISIT?</span><h2 id="submit-title">Submit your photos and video.</h2><p>Share your contact details, the property address, and the Google Drive folder containing your completed files.</p></div></div>
    <form onSubmit={submit}>
      <div className="landing-form-grid">
        <label suppressHydrationWarning>Photographer&apos;s Name<input suppressHydrationWarning data-lpignore="true" data-1p-ignore type="text" name="photographerName" autoComplete="name" maxLength={200} required disabled={submitting} /></label>
        <label suppressHydrationWarning>Email<input suppressHydrationWarning data-lpignore="true" data-1p-ignore type="email" name="email" autoComplete="email" maxLength={320} required disabled={submitting} /></label>
        <label suppressHydrationWarning>Phone<input suppressHydrationWarning data-lpignore="true" data-1p-ignore type="tel" name="phone" autoComplete="tel" maxLength={50} required disabled={submitting} /></label>
        <label suppressHydrationWarning>Property Address<input suppressHydrationWarning data-lpignore="true" data-1p-ignore type="text" name="propertyAddress" autoComplete="street-address" maxLength={500} required disabled={submitting} /></label>
        <label className="landing-drive-field" suppressHydrationWarning>Google Drive Link<input suppressHydrationWarning data-lpignore="true" data-1p-ignore type="url" name="driveLink" inputMode="url" autoComplete="url" placeholder="https://drive.google.com/drive/folders/..." maxLength={2048} required disabled={submitting} /></label>
      </div>
      {showChecklist && <div className="landing-checklist-confirm"><input id="checklist-complete" type="checkbox" name="checklistComplete" required disabled={submitting} /><label htmlFor="checklist-complete">Did you complete the photo checklist?</label><a href="#photo-checklist">Review the checklist</a></div>}
      {error && <p className="landing-form-error" role="alert">{error}</p>}
      <div className="landing-form-submit"><small>Your details are sent securely to Home Offer 365.</small><button className="button primary" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit Photos"} <ArrowRight size={17} aria-hidden="true" /></button></div>
    </form>
  </section>;
}
