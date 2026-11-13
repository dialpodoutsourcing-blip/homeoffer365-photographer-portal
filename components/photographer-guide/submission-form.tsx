"use client";

import { ArrowRight, Send } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { checklistGroups } from "@/content/photographer-guide";
import { applyAddressLocality, findAddressLocalities, formatAddressLocality, type AddressLocality } from "@/lib/address-suggestions";
import { checklistGroupsComplete } from "@/lib/submissions/checklist-groups";
import { SubmissionConfirmation } from "./submission-confirmation";

const addressListId = "property-address-suggestions";

export function SubmissionForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const addressSuggestions = findAddressLocalities(address, 5);

  function closeSuggestions() {
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
  }

  function selectLocality(locality: AddressLocality) {
    setAddress(applyAddressLocality(address, locality));
    closeSuggestions();
  }

  function handleAddressKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      closeSuggestions();
      return;
    }
    if (!addressSuggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSuggestionsOpen(true);
      setActiveSuggestion((current) => current < addressSuggestions.length - 1 ? current + 1 : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSuggestionsOpen(true);
      setActiveSuggestion((current) => current > 0 ? current - 1 : addressSuggestions.length - 1);
    } else if (event.key === "Enter" && suggestionsOpen && activeSuggestion >= 0) {
      event.preventDefault();
      selectLocality(addressSuggestions[activeSuggestion]);
    }
  }

  function closeConfirmation() {
    setSubmitted(false);
    window.requestAnimationFrame(() => document.querySelector<HTMLInputElement>('input[name="photographerName"]')?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    closeSuggestions();

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
          checklistComplete: checklistGroupsComplete(formData),
        }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || "We could not save your submission. Please try again.");
      setAddress("");
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
        <div className="landing-address-field">
          <label htmlFor="property-address" suppressHydrationWarning>Property Address</label>
          <input id="property-address" suppressHydrationWarning data-lpignore="true" data-1p-ignore type="text" name="propertyAddress" autoComplete="street-address" maxLength={500} required disabled={submitting} value={address} role="combobox" aria-autocomplete="list" aria-expanded={suggestionsOpen && addressSuggestions.length > 0} aria-controls={addressListId} aria-activedescendant={suggestionsOpen && activeSuggestion >= 0 ? `${addressListId}-${activeSuggestion}` : undefined} onChange={(event) => { setAddress(event.target.value); setSuggestionsOpen(true); setActiveSuggestion(-1); }} onFocus={() => setSuggestionsOpen(addressSuggestions.length > 0)} onBlur={closeSuggestions} onKeyDown={handleAddressKeyDown} />
          <small>Suggested service areas in Pennsylvania</small>
          {suggestionsOpen && addressSuggestions.length > 0 && <div id={addressListId} className="landing-address-options" role="listbox" aria-label="Pennsylvania service areas">
            {addressSuggestions.map((locality, index) => <button id={`${addressListId}-${index}`} className={`landing-address-option${index === activeSuggestion ? " is-active" : ""}`} type="button" role="option" aria-selected={index === activeSuggestion} tabIndex={-1} key={`${locality.city}-${locality.zip}`} onPointerDown={(event) => { event.preventDefault(); selectLocality(locality); }} onClick={() => selectLocality(locality)}>{formatAddressLocality(locality)}</button>)}
          </div>}
        </div>
        <label className="landing-drive-field" suppressHydrationWarning>Google Drive Link<input suppressHydrationWarning data-lpignore="true" data-1p-ignore type="url" name="driveLink" inputMode="url" autoComplete="url" placeholder="https://drive.google.com/drive/folders/..." maxLength={2048} required disabled={submitting} /></label>
      </div>
      <fieldset className="landing-checklist-confirm" disabled={submitting}>
        <legend>Confirm every checklist group</legend>
        <p>Review every listed item, then confirm each group before submitting.</p>
        <div className="landing-checklist-confirm-grid">
          {checklistGroups.map((group, groupIndex) => <section className="landing-checklist-group" key={group.title}>
            <label htmlFor={`checklist-group-${groupIndex}`}><input id={`checklist-group-${groupIndex}`} type="checkbox" name={`checklistGroup-${groupIndex}`} required /><span><strong>{group.title}</strong><small>All items in this group are complete</small></span></label>
            <ul className="landing-checklist-group-items">{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>)}
        </div>
      </fieldset>
      {error && <p className="landing-form-error" role="alert">{error}</p>}
      <div className="landing-form-submit"><small>Your details are sent securely to Home Offer 365.</small><button className="button primary" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit Photos"} <ArrowRight size={17} aria-hidden="true" /></button></div>
    </form>
  </section>;
}
