"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, Building2, ClipboardCheck, Link2, ShieldCheck, Upload } from "lucide-react";

const mockProperties = [
  "101 Sample Oak Lane, Orlando, FL",
  "245 Demo Palm Avenue, Tampa, FL",
  "880 Preview Lake Drive, Jacksonville, FL",
];

function isGoogleDriveLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["drive.google.com", "docs.google.com"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function GuestLanding() {
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  function submitDriveLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const property = String(formData.get("property") ?? "");
    const driveLink = String(formData.get("driveLink") ?? "");

    if (!property) {
      setConfirmation("");
      setError("Select a property before submitting.");
      return;
    }
    if (!isGoogleDriveLink(driveLink)) {
      setConfirmation("");
      setError("Paste a valid Google Drive sharing link.");
      return;
    }

    setError("");
    setConfirmation(`Drive link received for ${property}. This mock submission is not saved yet.`);
  }

  return <div className="portal-workspace">
    <section className="panel portal-panel guest-landing">
      <span className="visit-auth-icon"><Link2 size={26} aria-hidden="true" /></span>
      <span className="eyebrow">FOR PHOTOGRAPHERS</span>
      <h2>Select your property. Share your files.</h2>
      <p>Choose the property you photographed, then paste the Google Drive link containing its photos and walkthrough video.</p>

      <div className="guest-steps">
        <div><Building2 size={22} aria-hidden="true" /><strong>01 · Select your property</strong><p>Choose the address for this visit.</p></div>
        <div><Upload size={22} aria-hidden="true" /><strong>02 · Add your files</strong><p>Upload your files, then paste your Drive link.</p></div>
        <div><ClipboardCheck size={22} aria-hidden="true" /><strong>03 · Review & submit</strong><p>Check the property and sharing link before submitting.</p></div>
      </div>

      <form className="portal-form guest-link-form" onSubmit={submitDriveLink}>
        <label>Select property
          <select name="property" required defaultValue="">
            <option value="" disabled>Choose a sample property</option>
            {mockProperties.map((property) => <option key={property} value={property}>{property}</option>)}
          </select>
        </label>
        <label>Paste your Drive link
          <input type="url" name="driveLink" required autoComplete="off" placeholder="https://drive.google.com/drive/folders/..." />
        </label>
        <button className="button primary">Submit link<Upload size={17} aria-hidden="true" /></button>
      </form>
      {error && <p className="portal-error" role="alert">{error}</p>}
      {confirmation && <p className="portal-success" role="status">{confirmation}</p>}
      <p className="guest-link-help"><strong>Mockup:</strong> These sample properties and submitted links are not saved to the database yet.</p>
      <Link href="/photographers/photo-guide" className="resource-link">Review the photo guide →</Link>
    </section>
    <section className="guest-staff-access">
      <ShieldCheck size={22} aria-hidden="true" />
      <div><h2>Managing property visits?</h2><p>Staff can create visits, share private links, and review submissions.</p></div>
      <Link href="/photographers/staff" className="button secondary">Staff access<ArrowRight size={16} aria-hidden="true" /></Link>
    </section>
  </div>;
}
