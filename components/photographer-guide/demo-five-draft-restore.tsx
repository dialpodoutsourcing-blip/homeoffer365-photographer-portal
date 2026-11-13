import type { PhotoDraft } from "@/lib/demo-five/photo-draft-store";

export function DemoFiveDraftRestore({ drafts, unreadableCount, disabled, onRestore }: {
  drafts: PhotoDraft[]; unreadableCount: number; disabled: boolean; onRestore: (draft: PhotoDraft) => void;
}) {
  return <>
    {unreadableCount > 0 && <p className="demo-five-error" role="alert">{unreadableCount} saved visit(s) could not be read. Their data is preserved on this device. Other saved visits can still be restored.</p>}
    {drafts.length > 0 && <aside className="demo-five-restore"><h3>Continue a saved visit</h3>{drafts.map(value => <button type="button" key={value.draftKey} disabled={disabled} onClick={() => onRestore(value)}>Restore {value.propertyAddress || "unfinished visit"} ({value.photos.length} photos)</button>)}</aside>}
  </>;
}
