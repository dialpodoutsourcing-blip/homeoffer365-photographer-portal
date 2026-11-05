"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckCheck, ClipboardCheck, FileText, RefreshCw, Save } from "lucide-react";
import { checklistGroups } from "@/content/photographer-guide";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Assignment, ResponseValue, VisitResponses } from "@/lib/portal/types";
import { VisitFiles } from "./visit-files";

export function VisitEditor({ visit, client, tools, onDirty, onSaved, onWorking }: { visit: Assignment; client: SupabaseClient; tools?: ReactNode; onDirty: (dirty: boolean) => void; onSaved: (visit: Assignment) => void; onWorking: (busy: boolean) => void }) {
  const [responses, setResponses] = useState<VisitResponses>(visit.responses);
  const [notes, setNotes] = useState(visit.notes);
  const [busy, setBusy] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { onWorking(busy || transferring); }, [busy, transferring, onWorking]);
  useEffect(() => {
    const editor = document.getElementById("active-property-visit");
    editor?.focus({ preventScroll: true });
    editor?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }, [visit.id]);
  const locked = visit.status === "submitted";
  const count = Object.keys(responses).length;
  const total = checklistGroups.reduce((sum, group) => sum + group.items.length, 0);
  function changed() { setDirty(true); onDirty(true); setMessage(""); }
  async function save(submit: boolean) {
    if (submit && !window.confirm("Submit this visit? Its checklist and uploaded files will become read-only.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data, error } = await client.rpc("save_assignment", { p_id: visit.id, p_revision: visit.revision, p_responses: responses, p_notes: notes, p_submit: submit }).single();
      if (error) throw new Error(error.message);
      onSaved(data as Assignment); setDirty(false);
      setMessage(submit ? "Your visit has been submitted." : "Draft saved. You can return to it later.");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save. Your edits are still on this page; try again."); }
    finally { setBusy(false); }
  }
  return <section id="active-property-visit" tabIndex={-1} className="panel portal-panel visit-editor" aria-busy={busy} aria-label={`Property visit: ${visit.address}`}>
    <div className="portal-visit-heading"><div><span className="eyebrow">{locked ? "SUBMISSION RECEIPT" : "02 / CAPTURE & REVIEW"}</span><h2>{visit.address}</h2></div><span className={`visit-badge${locked ? " is-submitted" : ""}`}>{locked ? "Submitted" : dirty ? "Unsaved changes" : "Draft saved"}</span></div>
    <p className="portal-reference">Visit ID: <code>{visit.id}</code> · Checklist v{visit.template_version} · Last saved {new Date(visit.updated_at).toLocaleString("en-US")}</p>
    <button className="resource-link visit-reload" type="button" disabled={busy || transferring} onClick={async () => {
      if (dirty && !window.confirm("Discard unsaved checklist changes and reload this visit?")) return;
      setBusy(true); setError("");
      try {
        const { data, error } = await client.from("assignments").select("*").eq("id", visit.id).single();
        if (error) throw new Error(error.message);
        const saved = data as Assignment; onSaved(saved); setResponses(saved.responses); setNotes(saved.notes); setDirty(false); setMessage("Saved visit reloaded.");
      } catch (error) { setError(error instanceof Error ? error.message : "Could not reload the visit."); }
      finally { setBusy(false); }
    }}><RefreshCw size={13} aria-hidden="true" />Reload saved visit</button>
    {tools}
    {locked && <p className="completion-message">Submitted on {new Date(visit.submitted_at!).toLocaleString("en-US")}. This receipt and its files are read-only. Contact your assigned team member if a correction is needed.</p>}
    <nav className="visit-section-nav" aria-label="Sections in this property visit"><a href="#visit-files">01 <span>Photos & video</span></a><a href="#visit-checklist">02 <span>Checklist</span></a><a href="#visit-notes">03 <span>Visit notes</span></a></nav>
    <VisitFiles client={client} visit={visit} locked={locked || busy} onBusy={setTransferring} />
    <div className="visit-section-heading" id="visit-checklist"><span><ClipboardCheck size={22} aria-hidden="true" /></span><div><h3>Property checklist</h3><p>Review your coverage, one area at a time.</p></div><strong>{Math.round(count / total * 100)}%</strong></div><p>Select Unavailable / N/A only when an item does not apply or cannot be safely accessed. Explain each exception in the notes.</p>
    <progress value={count} max={total} aria-label="Property checklist reviewed items" /><p className="portal-reference">{count} of {total} reviewed. {Object.values(responses).filter((value) => value === "unavailable").length} exceptions.</p>
    <fieldset disabled={locked || busy || transferring} className="portal-checklist"><legend className="sr-only">Checklist for {visit.address}</legend>
      {checklistGroups.map((group, groupIndex) => <details className="visit-review-group" key={group.title} open><summary><span>{group.title}</span><span>{group.items.filter((_, index) => responses[`${groupIndex}-${index}`]).length} / {group.items.length} reviewed</span></summary><div>{group.items.map((label, index) => {
        const id = `${groupIndex}-${index}`;
        return <label className="portal-response" key={id}><span>{label}</span><select value={responses[id] ?? ""} onChange={(event) => {
          const next = { ...responses }; if (event.target.value) next[id] = event.target.value as ResponseValue; else delete next[id];
          setResponses(next); changed();
        }}><option value="">Not reviewed</option><option value="done">Complete</option>{groupIndex !== 4 && <option value="unavailable">Unavailable / N/A</option>}</select></label>;
      })}</div></details>)}
      <div className="visit-section-heading" id="visit-notes"><span><FileText size={22} aria-hidden="true" /></span><div><h3>Visit notes</h3><p>The context your team needs.</p></div></div>
      <label className="portal-field">Issues, missing areas & exceptions<textarea value={notes} maxLength={5000} rows={5} onChange={(event) => { setNotes(event.target.value); changed(); }} placeholder="Describe missing or inaccessible areas, explain N/A items, and note visible condition issues or that no issues were observed." /></label><p className="visit-note-count">{notes.length.toLocaleString("en-US")} / 5,000 characters</p>
    </fieldset>
    {!locked && <div className="portal-actions visit-savebar"><span>{transferring ? "File operation in progress…" : dirty ? "You have unsaved checklist changes" : "Checklist changes saved"}</span><button type="button" className="button secondary" disabled={busy || transferring || !dirty} onClick={() => { setResponses(visit.responses); setNotes(visit.notes); setDirty(false); onDirty(false); setError(""); setMessage("Unsaved checklist edits discarded."); }}>Discard edits</button><button type="button" className="button secondary" disabled={busy || transferring || !dirty} onClick={() => save(false)}><Save size={16} aria-hidden="true" />Save draft</button><button type="button" className="button primary" disabled={busy || transferring || count !== total} onClick={() => save(true)}><CheckCheck size={17} aria-hidden="true" />{busy ? "Saving…" : "Submit visit"}</button></div>}
    {!locked && <p className="portal-reference">Save drafts before leaving this page. Files save immediately; checklist changes save when you choose Save draft or Submit visit. Submission requires photos and a walkthrough, or documented exceptions for unavailable groups.</p>}
    {message && <p className="portal-notice" role="status">{message}</p>}{error && <p className="portal-error" role="alert">{error}</p>}
  </section>;
}
