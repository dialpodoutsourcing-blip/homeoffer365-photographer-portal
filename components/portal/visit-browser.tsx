"use client";

import { useState } from "react";
import { ArrowRight, CalendarDays, CheckCheck, FilePenLine, House, Search } from "lucide-react";
import { checklistGroups } from "@/content/photographer-guide";
import type { Assignment } from "@/lib/portal/types";

const total = checklistGroups.reduce((sum, group) => sum + group.items.length, 0);
const date = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function VisitBrowser({ visits, selected, disabled, onSelect }: { visits: Assignment[]; selected: string; disabled: boolean; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(6);
  const drafts = visits.filter((visit) => visit.status === "draft").length;
  const filtered = visits.filter((visit) => (filter === "all" || visit.status === filter) && visit.address.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <div className="visit-stats" aria-label="Visit overview">
      <div><span className="visit-stat-icon"><House size={19} aria-hidden="true" /></span><div><strong>{visits.length}</strong><span>Total visits</span></div></div>
      <div><span className="visit-stat-icon"><FilePenLine size={19} aria-hidden="true" /></span><div><strong>{drafts}</strong><span>Drafts to finish</span></div></div>
      <div><span className="visit-stat-icon"><CheckCheck size={19} aria-hidden="true" /></span><div><strong>{visits.length - drafts}</strong><span>Submitted</span></div></div>
    </div>
    {!!visits.length && <div className="visit-filters"><label className="visit-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Search visits by address</span><input type="search" value={query} placeholder="Search a property address…" onChange={(event) => { setQuery(event.target.value); setLimit(6); }} /></label><label className="portal-field"><span className="sr-only">Filter visit status</span><select value={filter} onChange={(event) => { setFilter(event.target.value); setLimit(6); }}><option value="all">All visits</option><option value="draft">Drafts</option><option value="submitted">Submitted</option></select></label></div>}
    {!visits.length ? <div className="visit-empty"><House size={30} aria-hidden="true" /><h3>Your first visit starts here.</h3><p>Add a property address below. You can save your work and come back whenever you need.</p></div> : <>
      <p className="visit-results" role="status">{filtered.length} {filtered.length === 1 ? "visit" : "visits"}{query || filter !== "all" ? " matching your filters" : " available"}</p>
      {filtered.length ? <div className="visit-card-grid">{filtered.slice(0, limit).map((visit) => {
        const reviewed = Object.keys(visit.responses).length;
        const submitted = visit.status === "submitted";
        return <button type="button" className={`visit-card${selected === visit.id ? " is-selected" : ""}`} key={visit.id} disabled={disabled} aria-pressed={selected === visit.id} onClick={() => onSelect(visit.id)}>
          <span className="visit-card-top"><span className="visit-card-house"><House size={19} aria-hidden="true" /></span><span className={`visit-badge${submitted ? " is-submitted" : ""}`}>{submitted ? "Submitted" : "Draft"}</span></span>
          <strong className="visit-card-address">{visit.address}</strong>
          <span className="visit-card-date"><CalendarDays size={13} aria-hidden="true" />Created {date(visit.created_at)}</span>
          <span className="visit-card-progress"><span style={{ width: `${Math.min(reviewed / total, 1) * 100}%` }} /></span>
          <span className="visit-card-bottom"><span>{reviewed}/{total} items reviewed</span><span>{selected === visit.id ? "Currently open" : submitted ? "View receipt" : "Continue visit"}<ArrowRight size={14} aria-hidden="true" /></span></span>
        </button>;
      })}</div> : <div className="visit-empty"><Search size={26} aria-hidden="true" /><h3>No matching visits</h3><p>Try another address or choose All visits.</p><button className="button secondary" type="button" onClick={() => { setQuery(""); setFilter("all"); setLimit(6); }}>Clear filters</button></div>}
      {filtered.length > limit && <button type="button" className="button secondary visit-show-more" onClick={() => setLimit((previous) => previous + 6)}>Show more visits ({filtered.length - limit} remaining)</button>}
    </>}
  </>;
}
