"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, ShieldCheck } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Assignment } from "@/lib/portal/types";
import { createVisitToken } from "@/lib/portal/visit-links";

type VisitLink = { id: string; expires_at: string; revoked_at: string | null };

export function StaffLinkManager({ visit, client, disabled, onBusy }: { visit: Assignment; client: SupabaseClient; disabled: boolean; onBusy: (value: boolean) => void }) {
  const [link, setLink] = useState<VisitLink | null>(null);
  const [url, setUrl] = useState("");
  const [days, setDays] = useState("7");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let live = true;
    client.from("visit_links").select("id,expires_at,revoked_at").eq("assignment_id", visit.id).is("revoked_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle().then(({ data, error }) => {
      if (!live) return;
      if (error) setError("Private links are not ready. Ask your project owner to finish workspace setup.");
      else setLink(data);
      setLoading(false);
    });
    return () => { live = false; };
  }, [client, visit.id]);
  const active = !!link && !link.revoked_at && new Date(link.expires_at).getTime() > now;
  async function manage(revoke: boolean) {
    if ((revoke || active) && !window.confirm(revoke ? "Revoke this visit's photographer link? Existing guest access will stop." : "Replace the link? The previous link and its guest access will stop working.")) return;
    setBusy(true); onBusy(true); setError(""); setMessage("");
    try {
      if (revoke) {
        const { error } = await client.rpc("revoke_visit_links", { p_id: visit.id });
        if (error) throw new Error(error.message);
        setLink(null); setUrl(""); setMessage("Guest access revoked.");
      } else {
        const token = createVisitToken();
        const { data, error } = await client.rpc("replace_visit_link", { p_id: visit.id, p_token: token, p_days: Number(days) }).single();
        if (error) throw new Error(error.message);
        setLink(data as VisitLink);
        setUrl(`${window.location.origin}/photographers/visit/${visit.id}#token=${token}`);
        setMessage("Link created. Copy it now and share it privately with the assigned photographer.");
      }
    } catch (error) { setError(error instanceof Error ? error.message : "Could not update the link. Please try again."); }
    finally { setBusy(false); onBusy(false); }
  }
  return <section className="staff-link-manager" aria-label="Photographer access link">
    <div className="visit-section-heading"><span><Link2 size={22} aria-hidden="true" /></span><div><h3>Photographer access</h3><p>No photographer account or password needed.</p></div></div>
    {loading ? <p role="status">Checking link status…</p> : <p className="portal-reference">{active ? `Link active until ${new Date(link!.expires_at).toLocaleString("en-US")}.` : "No active photographer link."}</p>}
    <div className="staff-link-controls">
      {visit.status === "draft" && <><label className="portal-field">Link expires in<select value={days} disabled={busy || disabled || loading} onChange={(event) => setDays(event.target.value)}>{[1,7,14,30].map((days) => <option key={days} value={days}>{days} {days === 1 ? "day" : "days"}</option>)}</select></label><button className="button primary" type="button" disabled={busy || disabled || loading} onClick={() => manage(false)}><Link2 size={16} aria-hidden="true" />{busy ? "Updating…" : active ? "Replace link" : "Create private link"}</button></>}
      {active && <button className="button secondary" type="button" disabled={busy || disabled || loading} onClick={() => manage(true)}>Revoke guest access</button>}
    </div>
    {url && <div className="staff-share-url"><label className="portal-field">Private photographer link<input readOnly value={url} autoComplete="off" onFocus={(event) => event.currentTarget.select()} /></label><button className="button secondary" type="button" onClick={async () => {
      try { await navigator.clipboard.writeText(url); setMessage("Link copied. Share it only with the assigned photographer."); }
      catch { setMessage("Select the link above and copy it manually."); }
    }}><Copy size={16} aria-hidden="true" />Copy link</button></div>}
    <p className="portal-reference"><ShieldCheck size={13} aria-hidden="true" />Anyone holding the link can access this visit until it expires or is revoked. Copy new links before leaving; an existing link cannot be retrieved later. You can replace it if needed.</p>
    {message && <p className="portal-notice" role="status">{message}</p>}{error && <p className="portal-error" role="alert">{error}</p>}
  </section>;
}
