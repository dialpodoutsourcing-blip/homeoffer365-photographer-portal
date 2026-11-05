"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void; size: string }) => string;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }

export function CaptchaVerification({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!ready || !window.turnstile || !container.current) return;
    const element = container.current;
    const turnstile = window.turnstile;
    let widget: string | null = null;
    let size = "";
    const render = () => {
      const nextSize = element.clientWidth < 300 ? "compact" : "flexible";
      if (widget && size === nextSize) return;
      if (widget) { turnstile.remove(widget); onToken(""); }
      size = nextSize;
      try { widget = turnstile.render(element, {
        sitekey: siteKey, size,
        callback: (token) => { setError(""); onToken(token); },
        "expired-callback": () => onToken(""),
        "error-callback": () => { onToken(""); setError("Verification could not load. Refresh the page to try again."); },
      }); } catch {
        queueMicrotask(() => setError("Verification is unavailable. Ask your team to check verification setup."));
        onToken("");
      }
    };
    render();
    const observer = new ResizeObserver(render);
    observer.observe(element);
    return () => { observer.disconnect(); if (widget) turnstile.remove(widget); };
  }, [ready, siteKey, onToken]);
  return <div className="guest-captcha"><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setReady(true)} onError={() => setError("Verification could not load. Check your connection and refresh.")} /><div ref={container} />{error && <p role="alert">{error}</p>}</div>;
}
