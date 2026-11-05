"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, ClipboardCheck, Headphones, House, Upload } from "lucide-react";
import { Suspense } from "react";

const navigation = [
  { href: "/photographers", label: "Welcome", icon: House },
  { href: "/photographers/photo-guide", label: "Photo guide", icon: Camera },
  { href: "/photographers/checklist", label: "Checklist", icon: ClipboardCheck },
  { href: "/photographers/upload", label: "Property visits", icon: Upload },
  { href: "/photographers/help", label: "Need help?", icon: Headphones },
];

export function SidebarNavigation({ onSelect }: { onSelect?: () => void } = {}) {
  return <Suspense fallback={<NavigationLinks onSelect={onSelect} />}><ActiveNavigation onSelect={onSelect} /></Suspense>;
}

function ActiveNavigation({ onSelect }: { onSelect?: () => void }) {
  const pathname = usePathname();
  return <NavigationLinks pathname={pathname} onSelect={onSelect} />;
}

function NavigationLinks({ pathname = "", onSelect }: { pathname?: string; onSelect?: () => void }) {

  return (
    <nav aria-label="Photographer guide pages">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href === "/photographers/upload" && (pathname.startsWith("/photographers/visit/") || pathname === "/photographers/staff")) || (href === "/photographers" && ["/", "/photographers/team", "/photographers/homeowner-stories"].includes(pathname));
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={onSelect}>
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
