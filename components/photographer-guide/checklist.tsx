"use client";

import Link from "next/link";
import { useChecklist } from "./checklist-state";
import { ClipboardCheck, RotateCcw, Printer, ChevronDown, ArrowUpRight } from "lucide-react";
import { checklistGroups } from "@/content/photographer-guide";

const total = checklistGroups.reduce((sum, group) => sum + group.items.length, 0);

export function Checklist() {
  const { checked, setChecked } = useChecklist();
  function toggle(id: string) { setChecked((previous) => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  function printGuide() {
    const closedGroups = Array.from(document.querySelectorAll("main details")).filter((group) => !group.hasAttribute("open"));
    closedGroups.forEach((group) => group.setAttribute("open", ""));
    try { window.print(); }
    finally { closedGroups.forEach((group) => group.removeAttribute("open")); }
  }
  return <section id="checklist" className="panel checklist-panel">
    <div className="section-heading"><span className="section-icon"><ClipboardCheck size={23} aria-hidden="true" /></span><div><span className="eyebrow">BEFORE YOU SUBMIT</span><h2>Your visit checklist</h2></div></div><p className="section-description">A little double-check goes a long way.</p>
    <div className="checklist-progress"><div><strong aria-live="polite">{checked.size} <span>of {total} checked</span></strong><span>{Math.round(checked.size / total * 100)}%</span></div><progress max={total} value={checked.size} aria-label="Visit checklist completion" /></div>
    <p className="session-note">This is a practice checklist. Checks stay between guide pages and clear on reload. For a saved checklist attached to a property, use the <Link href="/photographers/upload" className="resource-link">property workspace</Link>.</p>
    <div className="checklist-groups">{checklistGroups.map((group, index) => <details key={group.title} className="checklist-group" open><summary><span>{group.title}</span><span className="group-count">{group.items.filter((_, itemIndex) => checked.has(`${index}-${itemIndex}`)).length}/{group.items.length}<ChevronDown size={15} aria-hidden="true" /></span></summary><div>{group.items.map((item, itemIndex) => { const id = `${index}-${itemIndex}`; return <label className="checklist-item" key={id}><input type="checkbox" checked={checked.has(id)} onChange={() => toggle(id)} /><span>{item}</span></label>; })}</div></details>)}</div>
    {checked.size === total && <p className="completion-message" role="status">Practice review complete. Open the property workspace to save the actual visit checklist and submit its files.</p>}
    <div className="checklist-tools"><button type="button" onClick={() => setChecked(new Set())} disabled={checked.size === 0}><RotateCcw size={14} aria-hidden="true" />Reset</button><button type="button" onClick={printGuide}><Printer size={14} aria-hidden="true" />Print checklist</button></div><Link className="button primary checklist-cta" href="/photographers/upload">Ready to upload? <ArrowUpRight size={17} aria-hidden="true" /></Link>
  </section>;
}
