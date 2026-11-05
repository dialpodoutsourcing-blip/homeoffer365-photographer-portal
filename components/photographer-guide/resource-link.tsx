import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function ResourceLink({ href, children, className = "" }: { href: string | null; children: ReactNode; className?: string }) {
  if (href?.startsWith("/") && !href.startsWith("//")) {
    return <Link className={`resource-link ${className}`} href={href}>{children}<ArrowUpRight size={16} aria-hidden="true" /></Link>;
  }
  return href ? <a className={`resource-link ${className}`} href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a> : <span className={`resource-link unavailable ${className}`}>{children}<span className="pending-label">Coming soon</span></span>;
}
