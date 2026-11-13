import { validateSubmissionManifest, type DraftPhoto } from "./photo-workflow.ts";
import type { PhotoDraft, PhotoDraftStore, UploadEntry } from "./photo-draft-store.ts";

export type { UploadEntry } from "./photo-draft-store.ts";
type PreparedSession = { sessionId: string; idempotencyKey: string; uploads: UploadEntry[] };
export type UploadPhotoDraft = PhotoDraft;
export type UploadProgress = { phase: "preparing" | "uploading" | "finalizing" | "complete"; completed: number; total: number; currentPhotoName: string };
type Submission = { submissionId: string; photographerId: string; photoCount: number };
type Result = { ok: true; submission: Submission } | { ok: false; error: string; code?: string; failedPhotoIds: string[] };
type Options = { store: PhotoDraftStore; onProgress?: (progress: UploadProgress) => void; isOnline?: () => boolean };
const activeUploads = new WeakMap<UploadPhotoDraft, Promise<Result>>();

export function validStorageOrigin(value: string | undefined): string {
  try {
    const url = new URL(value ?? "");
    if (url.protocol === "https:" && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash) return url.origin;
  } catch { /* Invalid configuration is reported before upload. */ }
  return "";
}

export async function uploadToSignedPhotoUrl(origin: string, entry: UploadEntry, photo: DraftPhoto, fetcher: typeof fetch = fetch): Promise<void> {
  const validated = validStorageOrigin(origin);
  if (!validated) throw new Error("Photo upload configuration is unavailable. Please contact Home Offer 365.");
  if (entry.alreadyUploaded) return;
  if (!entry.signedToken) throw new Error("The photo upload authorization is missing. Please retry.");
  const path = entry.objectPath.split("/").map(encodeURIComponent).join("/");
  const response = await fetcher(`${validated}/storage/v1/object/upload/sign/photographer-photos/${path}?token=${encodeURIComponent(entry.signedToken)}`, {
    method: "PUT", headers: { "content-type": photo.mimeType, "x-upsert": "false" }, body: photo.blob,
  });
  if (!response.ok) {
    const error = new Error(`Could not upload ${photo.photoName}. Please retry.`);
    // A lost upload response can leave an existing object; re-prepare with the
    // same key on the next retry so the server verifies that object for us.
    Object.assign(error, { code: response.status === 400 || response.status === 409 ? "RECONCILE_UPLOAD" : undefined });
    throw error;
  }
}

export function uploadPhotoDraft(draft: UploadPhotoDraft, fetcher: typeof fetch, uploadToSignedUrl: (entry: UploadEntry, photo: DraftPhoto) => Promise<void>, options: Options): Promise<Result> {
  const active = activeUploads.get(draft);
  if (active) return active;
  const operation = runUpload(draft, fetcher, uploadToSignedUrl, options).finally(() => activeUploads.delete(draft));
  activeUploads.set(draft, operation);
  return operation;
}

async function runUpload(draft: UploadPhotoDraft, fetcher: typeof fetch, uploadToSignedUrl: (entry: UploadEntry, photo: DraftPhoto) => Promise<void>, options: Options): Promise<Result> {
  const failedPhotoIds: string[] = [];
  const save = (value: PhotoDraft) => options.store.save(value);
  let total = draft.photos.length;
  const progress = (phase: UploadProgress["phase"], currentPhotoName = "") => options.onProgress?.({ phase, completed: Math.min(draft.upload?.completedPhotoIds.length ?? 0, total), total, currentPhotoName });
  async function post<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetcher(`/api/demo-five/submissions/${endpoint}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw Object.assign(new Error(result.error || "Photo submission failed. Please retry."), { code: result.code });
    return result as T;
  }
  try {
    if (!(options.isOnline?.() ?? (typeof navigator === "undefined" || navigator.onLine !== false))) throw new Error("You are offline. Your photos are saved on this device; reconnect to submit.");
    // The read and first key assignment share one IndexedDB transaction. A
    // restored copy must use this authoritative manifest and attempt, never
    // overwrite them with its earlier in-memory snapshot.
    try { Object.assign(draft, await options.store.beginSubmission(draft.draftKey)); }
    catch (error) {
      if (error instanceof Error && error.name === "QuotaExceededError") throw new Error("Device storage is full. Free some space or remove unneeded photos, then retry. Your saved photos are preserved.");
      throw error;
    }
    const validation = validateSubmissionManifest(draft);
    if (!validation.ok || !draft.upload) throw new Error(validation.ok ? "Could not save the submission attempt. Please retry." : validation.error);
    total = draft.photos.length;
    progress("preparing");
    if (!draft.upload.prepared) {
      draft.upload.prepared = await post<PreparedSession>("prepare", { ...validation.value, idempotencyKey: draft.upload.idempotencyKey });
      draft.upload.completedPhotoIds = draft.upload.prepared.uploads.filter(entry => entry.alreadyUploaded).map(entry => entry.clientPhotoId);
      await save(draft);
    }
    const state = draft.upload, prepared = state.prepared!;
    if (prepared.idempotencyKey !== state.idempotencyKey || prepared.uploads.length !== total || new Set(prepared.uploads.map(entry => entry.clientPhotoId)).size !== total || draft.photos.some(photo => !prepared.uploads.some(entry => entry.clientPhotoId === photo.clientPhotoId))) throw new Error("The prepared photo list is incomplete. Please retry.");
    const pending = prepared.uploads.filter(entry => !entry.alreadyUploaded && !state.completedPhotoIds.includes(entry.clientPhotoId));
    let next = 0, reconcile = false, storageError: unknown;
    // Serialize local persistence even though network uploads run concurrently.
    let persistence = Promise.resolve();
    progress("uploading");
    await Promise.all(Array.from({ length: Math.min(3, pending.length) }, async () => {
      while (next < pending.length) {
        const entry = pending[next++];
        const photo = draft.photos.find(item => item.clientPhotoId === entry.clientPhotoId)!;
        progress("uploading", photo.photoName);
        try {
          if (!entry.signedToken) throw new Error("Missing upload authorization.");
          await uploadToSignedUrl(entry, photo);
          state.completedPhotoIds.push(entry.clientPhotoId);
          persistence = persistence.then(() => save(draft));
          await persistence.catch(error => { storageError = error; });
          progress("uploading", photo.photoName);
        } catch (error) {
          if (error instanceof Error && "code" in error && error.code === "RECONCILE_UPLOAD") reconcile = true;
          failedPhotoIds.push(entry.clientPhotoId);
        }
      }
    }));
    if (reconcile) { state.prepared = undefined; await save(draft); }
    if (storageError) throw storageError;
    if (failedPhotoIds.length) throw new Error(`${failedPhotoIds.length} photo(s) could not upload. Your draft is saved. Retry to upload the remaining photos.`);
    progress("finalizing");
    const submission = await post<Submission>("finalize", { sessionId: prepared.sessionId, idempotencyKey: state.idempotencyKey,
      photos: validation.value.photos.map(photo => ({ ...photo, objectPath: prepared.uploads.find(entry => entry.clientPhotoId === photo.clientPhotoId)!.objectPath })), notApplicable: validation.value.notApplicable });
    if (!submission.submissionId || submission.photoCount !== total) throw new Error("The submission confirmation was incomplete. Please retry safely.");
    progress("complete");
    return { ok: true, submission };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "UPLOAD_INCOMPLETE" && draft.upload) {
      // The server is authoritative after an interrupted upload or storage loss.
      // Re-prepare under the existing key to discover only the missing objects.
      draft.upload.prepared = undefined;
      try { await save(draft); } catch { /* Keep the in-memory draft for retry. */ }
    }
    return { ok: false, error: error instanceof Error ? error.message : "Could not submit your photos. Please retry.", code: error instanceof Error && "code" in error ? String(error.code) : undefined, failedPhotoIds };
  }
}
