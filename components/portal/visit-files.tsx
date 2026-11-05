"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { Camera, FolderOpen, RefreshCw, UploadCloud } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { bucket, categories, validateFile, type Assignment, type VisitFile } from "@/lib/portal/types";

export function VisitFiles({ visit, client, locked, onBusy }: { visit: Assignment; client: SupabaseClient; locked: boolean; onBusy: (busy: boolean) => void }) {
  const [files, setFiles] = useState<VisitFile[]>([]);
  const [category, setCategory] = useState("exterior");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<Record<string, string>>({});
  const prefix = `${visit.owner_id}/${visit.id}`;
  const selectedCategory = categories.find((option) => option.id === category)!;
  const visibleFiles = files.filter((file) => file.category === selectedCategory.label);
  const loadFiles = useCallback(async () => {
    const { data: access, error: accessError } = await client.from("assignments").select("id").eq("id", visit.id).maybeSingle();
    if (accessError) throw new Error(accessError.message);
    if (!access) throw new Error("Visit access is no longer available. Ask your team for a new private link.");
    const result: VisitFile[] = [];
    for (const category of categories) {
      let offset = 0;
      while (true) {
        const { data, error } = await client.storage.from(bucket).list(`${prefix}/${category.id}`, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
        if (error) throw new Error(error.message);
        result.push(...data.filter((file) => file.id).map((file) => ({ name: file.name.slice(37), path: `${prefix}/${category.id}/${file.name}`, category: category.label, size: Number(file.metadata?.size ?? 0) })));
        if (data.length < 100) break;
        offset += 100;
      }
    }
    return result;
  }, [client, prefix, visit.id]);
  useEffect(() => {
    let live = true;
    loadFiles().then((files) => { if (live) { setFiles(files); setError(""); } }).catch((error) => { if (live) setError(error.message); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [loadFiles]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const selected = Array.from(input.files ?? []);
    if (!selected.length) return;
    setError(""); setStatus("");
    if (selected.length > 25) { setError("Choose up to 25 files per batch."); input.value = ""; return; }
    for (const file of selected) {
      const problem = validateFile(file, category);
      if (problem) { setError(`${file.name}: ${problem}`); input.value = ""; return; }
    }
    setBusy(true); onBusy(true);
    let completed = 0;
    try {
      for (const file of selected) {
        setStatus(`Uploading ${completed + 1} of ${selected.length}: ${file.name}`);
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
        const { error } = await client.storage.from(bucket).upload(`${prefix}/${category}/${crypto.randomUUID()}-${safeName}`, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(error.message);
        completed++;
      }
      setStatus(`${completed} file${completed === 1 ? "" : "s"} uploaded.`);
    } catch (error) { setStatus(`${completed} of ${selected.length} uploaded. Retry only the remaining files.`); setError(error instanceof Error ? error.message : "Upload interrupted."); }
    finally {
      try { setFiles(await loadFiles()); } catch { setError("Could not refresh the file list. Use Refresh files before retrying an upload."); }
      input.value = ""; setBusy(false); onBusy(false);
    }
  }
  async function fileAction(file: VisitFile, remove: boolean) {
    setBusy(true); onBusy(true); setError(""); setStatus("");
    try {
      if (remove) {
        const { data, error } = await client.storage.from(bucket).remove([file.path]); if (error) throw new Error(error.message);
        if (!data?.length) throw new Error("File could not be removed. Reload the visit to check your access.");
        setFiles(await loadFiles()); setLinks((previous) => { const next = { ...previous }; delete next[file.path]; return next; });
        setStatus("File removed.");
      } else {
        const { data, error } = await client.storage.from(bucket).createSignedUrl(file.path, 60);
        if (error) throw new Error(error.message);
        setLinks((previous) => ({ ...previous, [file.path]: data.signedUrl }));
        setStatus("Your private viewing link is ready. It expires in one minute; choose Get link again to renew it.");
      }
    } catch (error) { setError(error instanceof Error ? error.message : "Could not complete the file action."); }
    finally { setBusy(false); onBusy(false); }
  }
  return <div className="portal-files" id="visit-files"><div className="visit-section-heading"><span><Camera size={22} aria-hidden="true" /></span><div><h3>Photos & walkthrough</h3><p>Every file, in the right place.</p></div><strong>{loading ? "…" : `${files.length} files`}</strong></div><p>Choose a category before uploading. Files save immediately to this visit.</p>
    <div className="visit-categories" role="group" aria-label="Media categories">{categories.map((option) => <button type="button" key={option.id} aria-pressed={category === option.id} disabled={busy} onClick={() => setCategory(option.id)}><FolderOpen size={16} aria-hidden="true" /><span>{option.label}</span><strong>{loading ? "–" : files.filter((file) => file.category === option.label).length}</strong></button>)}</div>
    {!locked && <div className="visit-upload-box"><UploadCloud size={29} aria-hidden="true" /><label className="portal-field">Add {selectedCategory.label.toLowerCase()} files<input type="file" multiple accept={category === "walkthrough" ? "video/mp4,video/quicktime,video/webm" : "image/jpeg,image/png,image/webp"} disabled={busy || loading} onChange={upload} /></label><p>{category === "walkthrough" ? "MP4, MOV or WebM" : "JPG, PNG or WebP"} · Up to 50 MB per file · 25 files per batch</p></div>}
    <button type="button" className="resource-link visit-reload" disabled={busy} onClick={async () => { setBusy(true); onBusy(true); try { setFiles(await loadFiles()); setError(""); } catch { setError("Could not load files. Try again."); } finally { setLoading(false); setBusy(false); onBusy(false); } }}><RefreshCw size={13} aria-hidden="true" />Refresh files</button>
    {loading ? <p role="status">Loading saved files…</p> : visibleFiles.length ? <ul className="portal-file-list">{visibleFiles.map((file) => <li key={file.path}><div><strong>{file.name}</strong><span>{file.category} · {(file.size / 1024 / 1024).toFixed(1)} MB</span></div><div className="portal-file-actions"><button type="button" disabled={busy} onClick={() => fileAction(file, false)}>Get link</button>{links[file.path] && <a href={links[file.path]} target="_blank" rel="noopener noreferrer">Open file ↗</a>}{!locked && <button type="button" disabled={busy} onClick={() => fileAction(file, true)}>Remove</button>}</div></li>)}</ul> : <p className="visit-file-empty">No {selectedCategory.label.toLowerCase()} files uploaded yet.</p>}
    {status && <p className="portal-notice" role="status">{status}</p>}{error && <p className="portal-error" role="alert">{error}</p>}
  </div>;
}
