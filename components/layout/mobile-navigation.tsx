"use client";

import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { useEffect, useRef, useState } from "react";
import { Heart, Menu, X } from "lucide-react";
import { SidebarNavigation } from "./sidebar-navigation";

export function MobileNavigation() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  function closeMenu() {
    dialog.current?.close();
  }

  function openMenu() {
    dialog.current?.showModal();
    setOpen(true);
  }

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 760px)");
    const closeOnDesktop = () => { if (!mobile.matches) dialog.current?.close(); };
    mobile.addEventListener("change", closeOnDesktop);
    return () => mobile.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  return (
    <>
      <header className="mobile-header">
        <Link className="mobile-brand" href="/photographers"><BrandLogo /></Link>
        <button className="mobile-menu-toggle" type="button" onClick={openMenu} aria-label="Open navigation menu" aria-expanded={open} aria-controls="mobile-navigation-panel" aria-haspopup="dialog"><Menu size={24} aria-hidden="true" /></button>
      </header>
      <dialog
        id="mobile-navigation-panel"
        className="mobile-menu"
        ref={dialog}
        aria-labelledby="mobile-menu-title"
        onClose={() => setOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}
      >
        <div className="mobile-menu-content">
          <div className="mobile-menu-heading"><h2 id="mobile-menu-title">Your field guide</h2><button type="button" className="mobile-menu-close" onClick={closeMenu} aria-label="Close navigation menu"><X size={23} aria-hidden="true" /></button></div>
          <p className="mobile-menu-intro">Everything for your property visit.</p>
          <SidebarNavigation onSelect={closeMenu} />
          <div className="mobile-menu-value"><Heart size={18} aria-hidden="true" /><strong>People Over Profit.</strong><p>Capture every property with care.</p></div>
        </div>
      </dialog>
    </>
  );
}
