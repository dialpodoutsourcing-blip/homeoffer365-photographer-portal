"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Link2, ShieldCheck } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getGuestSupabase } from "@/lib/supabase/client";
import { handleVisitHashChange, isVisitId, readVisitToken } from "@/lib/portal/visit-links";
import type { Assignment } from "@/lib/portal/types";
import { VisitEditor } from "./visit-editor";
import { CaptchaVerification } from "./captcha-verification";

const client = getGuestSupabase();
const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

async function loadVisit(client: SupabaseClient, id: string, token: string | null) {
  const result = token
    ? await client.rpc("redeem_visit_link", { p_id: id, p_token: token }).single()
    : await client.from("assignments").select("*").eq("id", id).single();
  if (result.error) throw result.error;
  return result.data as Assignment;
}

function accessError(error: unknown) {
  const details = error as { code?: string; message?: string };
  if (details?.code === "anonymous_provider_disabled" || details?.code === "signup_disabled") return "Guest access is not enabled yet. Ask your team to finish setting up private uploads.";
  if (details?.code === "PGRST202" || details?.code === "42P01") return "The property workspace is still being prepared. Ask your team to finish setup.";
  if (details?.code === "PGRST116" || details?.message?.includes("invalid, expired, or revoked")) return "This visit link is invalid, expired, or revoked. Ask your team for a new private link.";
  if (details?.code === "captcha_failed") return siteKey ? "Verification failed. Complete verification again and retry." : "Verification is required but not configured. Ask your team to finish verification setup.";
  return "We could not open this visit. Check your connection, try again, or ask your team for a new link.";
}

export function GuestVisit({ visitId }: { visitId: string }) {
  const [visit, setVisit] = useState<Assignment | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "opening">("loading");
  const [error, setError] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [working, setWorking] = useState(false);
  const token = useRef<string | null>(null);
  const validId = isVisitId(visitId);

  useEffect(() => {
    if (!client || !validId) return;
    let live = true;
    token.current = readVisitToken(window.location.hash);
    const reloadOnNewLink = () => handleVisitHashChange(window.location.hash, () => window.location.reload());
    window.addEventListener("hashchange", reloadOnNewLink);
    async function resume() {
      try {
        const { data, error } = await client!.auth.getSession();
        if (error) throw error;
        if (data.session) {
          const visit = await loadVisit(client!, visitId, token.current);
          if (live) {
            setVisit(visit);
            window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
          }
        }
      } catch (error) { if (live) setError(accessError(error)); }
      finally { if (live) setPhase("ready"); }
    }
    void resume();
    return () => { live = false; window.removeEventListener("hashchange", reloadOnNewLink); };
  }, [visitId, validId]);

  useEffect(() => {
    if (!dirty && !working) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, working]);

  async function open() {
    if (!client || !validId) return;
    setPhase("opening"); setError("");
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        if (!token.current) throw new Error("This visit link is invalid, expired, or revoked");
        const { error } = await client.auth.signInAnonymously({ options: { captchaToken: captcha || undefined } });
        if (error) throw error;
      }
      const visit = await loadVisit(client, visitId, token.current);
      setVisit(visit);
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    } catch (error) { setError(accessError(error)); setCaptcha(""); setCaptchaVersion((value) => value + 1); }
    finally { setPhase("ready"); }
  }

  if (!client) return <section className="panel portal-panel"><h2>Private uploads are being prepared</h2><p>Ask your team to finish connecting the workspace, then reopen your original visit link.</p><Link href="/photographers/photo-guide" className="resource-link">Review the photo guide →</Link></section>;
  if (!validId) return <section className="panel portal-panel"><h2>Invalid visit link</h2><p>Ask your team for the full private link to your property visit.</p></section>;
  return <div className="portal-workspace">
    {!visit ? <section className="panel portal-panel guest-access-card"><span className="visit-auth-icon"><Link2 size={24} aria-hidden="true" /></span><span className="eyebrow">YOUR ASSIGNED PROPERTY</span><h2>Open your private visit.</h2><p>No email, password, or registration needed. Your link opens only the property visit your team shared with you.</p>
      {phase === "loading" ? <p role="status">Checking your visit access…</p> : <>
        {siteKey && <CaptchaVerification key={captchaVersion} siteKey={siteKey} onToken={setCaptcha} />}
        <button className="button primary" type="button" disabled={phase === "opening" || (!!siteKey && !captcha)} onClick={open}>{phase === "opening" ? "Opening visit…" : "Open property visit"}<ArrowRight size={17} aria-hidden="true" /></button>
        {error && <p className="portal-error" role="alert">{error}</p>}
      </>}
      <p className="portal-reference"><ShieldCheck size={14} aria-hidden="true" />Use your original link when opening this visit on another device.</p>
    </section> : <>
      <div className="guest-visit-banner"><ShieldCheck size={22} aria-hidden="true" /><div><strong>Private property visit</strong><p>Confirm the address below. Save your checklist before leaving; uploaded files save immediately.</p></div></div>
      <VisitEditor key={visit.id} client={client} visit={visit} onDirty={setDirty} onWorking={setWorking} onSaved={(saved) => { setVisit(saved); setDirty(false); }} />
    </>}
  </div>;
}
