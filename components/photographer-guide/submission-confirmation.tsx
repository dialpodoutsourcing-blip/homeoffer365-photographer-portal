"use client";

import Image from "next/image";
import { Camera, Handshake, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";

export function SubmissionConfirmation({ onClose }: { onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const overlay = overlayRef.current;
    const backgroundElements = Array.from(document.body.children).filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlay);
    const previousInertValues = backgroundElements.map((backgroundElement) => backgroundElement.inert);
    document.body.style.overflow = "hidden";
    backgroundElements.forEach((backgroundElement) => { backgroundElement.inert = true; });
    closeButtonRef.current?.focus();

    function containDialogFocus(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", containDialogFocus);
    return () => {
      document.removeEventListener("keydown", containDialogFocus);
      backgroundElements.forEach((backgroundElement, index) => { backgroundElement.inert = previousInertValues[index]; });
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(<section ref={overlayRef} className="submission-confirmation-overlay" role="dialog" aria-modal="true" aria-labelledby="submission-confirmation-title">
    <button ref={closeButtonRef} className="submission-confirmation-close" type="button" aria-label="Close confirmation" onClick={onClose}><X size={22} aria-hidden="true" /></button>
    <div className="submission-confirmation-photo" aria-hidden="true" />
    <div className="submission-confirmation-content">
      <div className="submission-success-mark" aria-hidden="true">
        <i className="submission-success-ray submission-success-ray-one" />
        <i className="submission-success-ray submission-success-ray-two" />
        <i className="submission-success-ray submission-success-ray-three" />
        <i className="submission-success-ray submission-success-ray-four" />
        <span className="submission-success-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path pathLength="1" d="m5 12 4.2 4.2L19 6.8" /></svg></span>
      </div>

      <h2 id="submission-confirmation-title">Photos &amp; Videos<br />Successfully Submitted!</h2>

      <div className="submission-thank-you-card">
        <Image src="/images/team/ashley-sellers.jpg" width={244} height={276} alt="Ashley Sellers" priority />
        <div><strong>Thank You!</strong><p>Your submission has been received successfully.</p></div>
      </div>

      <p className="submission-appreciation"><span className="submission-appreciation-line">Thank you for your time, effort, and professional</span><span className="submission-appreciation-line">photography services. We truly appreciate your work.</span></p>

      <div className="submission-next-steps">
        <div><Camera aria-hidden="true" /><p>Our team will review your photos and videos, and <strong>your payment will be processed promptly</strong> once everything is approved.</p></div>
        <div><Handshake aria-hidden="true" /><p>We&apos;re excited to work with you on more projects in the future!</p></div>
      </div>

      <footer className="submission-confirmation-footer">
        <Image className="submission-confirmation-brand-logo" src="/images/brand/home-offer-365-logo.png" width={768} height={296} alt="Home Offer 365" />
        <i aria-hidden="true" />
        <div><strong>Ashley</strong><span>Home Offer 365 Team</span></div>
      </footer>
    </div>
  </section>, document.body);
}
