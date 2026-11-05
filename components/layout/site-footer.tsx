import { BrandLogo } from "./brand-logo";
import Link from "next/link";
import { ArrowRight, ArrowUp, Heart, Headphones, Mail, Phone } from "lucide-react";

const links = [
  { href: "/photographers", label: "Welcome" },
  { href: "/photographers/photo-guide", label: "Photo & video guide" },
  { href: "/photographers/checklist", label: "Visit checklist" },
  { href: "/photographers/upload", label: "Property visits & uploads" },
  { href: "/photographers/help", label: "Help & visit questions" },
];

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-about">
            <Link className="footer-brand" href="/photographers" aria-label="Home Offer 365 photographer welcome"><BrandLogo tone="dark" /></Link>
            <p>Clear photos. Accurate information.<br />A better experience for every homeowner.</p>
            <span className="footer-value"><Heart size={14} aria-hidden="true" />People Over Profit. Always.</span>
          </div>
          <nav className="footer-navigation" aria-labelledby="footer-guide-heading">
            <h2 id="footer-guide-heading">Quick links</h2>
            <ul>{links.map(({ href, label }) => <li key={href}><Link href={href}><ArrowRight size={14} aria-hidden="true" /><span>{label}</span></Link></li>)}</ul>
          </nav>
          <section className="footer-support" aria-labelledby="footer-support-heading">
            <Headphones size={23} aria-hidden="true" />
            <h2 id="footer-support-heading">Contact</h2>
            <dl className="footer-contact-details">
              <div><dt><Mail size={15} aria-hidden="true" />Email</dt><dd>photographers@example.com</dd></div>
              <div><dt><Phone size={15} aria-hidden="true" />Phone</dt><dd>+1 (202) 555-0148</dd></div>
            </dl>
            <span className="footer-contact-note">Placeholder details for this preview.</span>
            <p>Have a question before or during a visit? Contact your assigned team member.</p>
            <Link href="/photographers/help">Find help & guidance<ArrowRight size={15} aria-hidden="true" /></Link>
          </section>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Home Offer 365</span>
          <span>Thank you for capturing every property with care.</span>
          <a href="#main">Back to top<ArrowUp size={14} aria-hidden="true" /></a>
        </div>
      </div>
    </footer>
  );
}
