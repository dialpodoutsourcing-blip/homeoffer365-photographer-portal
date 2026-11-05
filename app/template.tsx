"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";

export default function GuideTemplate({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="page-transition">{children}</div>}><PathTransition>{children}</PathTransition></Suspense>;
}

function PathTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div key={pathname} className="page-transition">{children}</div>;
}
