import { BrandLogo } from "./brand-logo";
import { SiteFooter } from "./site-footer";
import { MobileNavigation } from "./mobile-navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Heart } from "lucide-react";
import { SidebarNavigation } from "./sidebar-navigation";

export function PortalShell({ children }: { children: ReactNode }) {
  return <div className="portal">
    <a className="skip-link" href="#main">Skip to content</a>
    <MobileNavigation />
    <aside className="sidebar" aria-label="Guide navigation">
      <Link className="brand" href="/photographers" aria-label="Home Offer 365 welcome"><BrandLogo /></Link>
      <div className="sidebar-label">PHOTOGRAPHER GUIDE</div>
      <SidebarNavigation />
      <div className="sidebar-note"><Heart size={20} aria-hidden="true" /><strong>People Over Profit.</strong><p>Good information starts<br />with people who care.</p></div>
      <div className="sidebar-bottom">HOME OFFER 365 <span>Field resources · v1.0</span></div>
    </aside>
    <div className="workspace"><header className="topbar"><div><span className="status-dot" />Photographer Portal<span className="topbar-divider">/</span><span className="topbar-detail">Your field guide</span></div><Link href="/photographers/help">We’re here to help <ArrowUpRight size={15} aria-hidden="true" /></Link></header><main id="main" className="main-content">{children}</main><SiteFooter /></div>
  </div>;
}
