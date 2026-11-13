import {
  OPTIONAL_FEATURES,
  validateDraftPhoto,
  validateSubmissionManifest,
  type DraftPhoto,
  type NotApplicableSelection,
  type PhotographerDetails,
} from "./photo-workflow.ts";

export type UploadEntry = { clientPhotoId: string; objectPath: string; alreadyUploaded: boolean; signedToken: string | null };
type DraftUpload = {
  idempotencyKey: string;
  prepared?: { sessionId: string; idempotencyKey: string; uploads: UploadEntry[] };
  completedPhotoIds: string[];
};
export type PhotoDraft = {
  version: 1;
  revision?: number;
  draftKey: string;
  browserDraftId: string;
  propertyAddress: string;
  photographer: PhotographerDetails;
  photos: DraftPhoto[];
  notApplicable: NotApplicableSelection[];
  updatedAt: string;
  upload?: DraftUpload;
};

export type PhotoDraftStore = {
  load(draftKey: string): Promise<PhotoDraft | null>;
  save(draft: PhotoDraft, previousKey?: string): Promise<void>;
  beginSubmission(draftKey: string): Promise<PhotoDraft>;
  delete(draftKey: string): Promise<void>;
  list(): Promise<{ drafts: PhotoDraft[]; unreadableDraftKeys: IDBValidKey[] }>;
};

const DATABASE_NAME = "homeoffer365-demo-five";
const DATABASE_VERSION = 1;
const STORE_NAME = "photo-drafts";

export class PhotoDraftCorruptionError extends Error {
  constructor() {
    super("This photo draft could not be read safely. Its saved data has been preserved.");
    this.name = "PhotoDraftCorruptionError";
  }
}

export class PhotoDraftConflictError extends Error {
  constructor() {
    super("This saved visit changed in another tab or was already submitted. Reload this page and restore the latest saved visit before continuing.");
    this.name = "PhotoDraftConflictError";
  }
}

export function createPhotoDraftKey(propertyAddress: string, browserDraftId: string): string {
  if (!browserDraftId.trim()) throw new Error("A stable browser draft ID is required.");
  const address = propertyAddress.trim().replace(/\s+/g, " ").toLowerCase();
  return `${encodeURIComponent(address)}:${encodeURIComponent(browserDraftId)}`;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertPhotoDraft(value: unknown): asserts value is PhotoDraft {
  const corrupt = () => { throw new PhotoDraftCorruptionError(); };
  if (!record(value) || value.version !== 1 || typeof value.browserDraftId !== "string" || !value.browserDraftId.trim()
    || (value.revision !== undefined && (!Number.isSafeInteger(value.revision) || (value.revision as number) < 0))
    || typeof value.propertyAddress !== "string" || typeof value.draftKey !== "string"
    || value.draftKey !== createPhotoDraftKey(value.propertyAddress, value.browserDraftId)
    || typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt))
    || !record(value.photographer) || !Array.isArray(value.photos) || !Array.isArray(value.notApplicable)) {
    return corrupt();
  }
  // A draft may have incomplete contact fields and fewer than the submission minimums.
  for (const field of ["name", "email", "phone", "paymentMethod", "paymentUrl"]) {
    if (typeof value.photographer[field] !== "string") corrupt();
  }
  if (value.photos.length > 100) corrupt();
  const photoIds = new Set<string>();
  let totalBytes = 0;
  for (const photo of value.photos) {
    const result = validateDraftPhoto(photo);
    if (!result.ok) return corrupt();
    const { blob, byteSize, mimeType, clientPhotoId } = result.value;
    if (blob.size !== byteSize || blob.type !== mimeType || photoIds.has(clientPhotoId)) corrupt();
    photoIds.add(clientPhotoId);
    totalBytes += byteSize;
  }
  if (totalBytes > 500 * 1024 * 1024) corrupt();
  const selections = new Set<string>();
  for (const selection of value.notApplicable) {
    if (!record(selection) || typeof selection.category !== "string" || !Object.hasOwn(OPTIONAL_FEATURES, selection.category)) {
      return corrupt();
    }
    const options = OPTIONAL_FEATURES[selection.category as keyof typeof OPTIONAL_FEATURES] as readonly unknown[];
    if (!options.includes(selection.photoType)) corrupt();
    const key = `${selection.category}:${selection.photoType}`;
    if (selections.has(key)) corrupt();
    selections.add(key);
  }
  if (value.upload !== undefined) {
    if (!record(value.upload) || typeof value.upload.idempotencyKey !== "string" || !value.upload.idempotencyKey
      || !Array.isArray(value.upload.completedPhotoIds) || value.upload.completedPhotoIds.some(id => !photoIds.has(id))
      || new Set(value.upload.completedPhotoIds).size !== value.upload.completedPhotoIds.length) return corrupt();
    const prepared = value.upload.prepared;
    if (prepared !== undefined && (!record(prepared) || typeof prepared.sessionId !== "string"
      || prepared.idempotencyKey !== value.upload.idempotencyKey || !Array.isArray(prepared.uploads)
      || prepared.uploads.some(entry => !record(entry) || !photoIds.has(entry.clientPhotoId as string)
        || typeof entry.objectPath !== "string" || typeof entry.alreadyUploaded !== "boolean"
        || (entry.signedToken !== null && typeof entry.signedToken !== "string")))) corrupt();
  }
}

export function createIndexedDbPhotoDraftStore(indexedDB: IDBFactory | undefined): PhotoDraftStore {
  function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!indexedDB) {
        reject(new Error("Local photo storage is unavailable in this browser."));
        return;
      }
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      let blocked = false;
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME, { keyPath: "draftKey" });
        }
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        blocked = true;
        reject(new Error("Local photo storage is blocked. Close other tabs using this form and try again."));
      };
      request.onsuccess = () => {
        if (blocked) {
          request.result.close();
          return;
        }
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
    });
  }

  async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await open();
    try {
      return await new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        let request: IDBRequest<T>;
        tx.oncomplete = () => resolve(request.result);
        tx.onabort = () => reject(tx.error ?? request?.error ?? new DOMException("Local photo storage transaction aborted.", "AbortError"));
        try {
          request = operation(tx.objectStore(STORE_NAME));
        } catch (error) {
          tx.abort();
          reject(error);
        }
      });
    } finally {
      db.close();
    }
  }

  async function change(key: string, update: (current: PhotoDraft | undefined, store: IDBObjectStore) => PhotoDraft): Promise<PhotoDraft> {
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite"), store = tx.objectStore(STORE_NAME);
        let result: PhotoDraft, failure: unknown;
        tx.oncomplete = () => resolve(result);
        tx.onabort = () => reject(failure ?? tx.error ?? new DOMException("Local photo storage transaction aborted.", "AbortError"));
        const request = store.get(key);
        request.onsuccess = () => {
          try {
            const current: unknown = request.result;
            if (current !== undefined) { assertPhotoDraft(current); current.revision ??= 0; }
            result = update(current, store);
          } catch (error) { failure = error; tx.abort(); }
        };
      });
    } finally { db.close(); }
  }

  return {
    async load(draftKey) {
      const value: unknown = await transaction("readonly", (store) => store.get(draftKey));
      if (value === undefined) return null;
      assertPhotoDraft(value);
      value.revision ??= 0;
      return value;
    },
    async save(draft, previousKey = draft.draftKey) {
      const snapshot: unknown = structuredClone(draft);
      assertPhotoDraft(snapshot);
      const saved = await change(previousKey, (current, store) => {
        if ((current?.revision ?? 0) !== (snapshot.revision ?? 0)
          || (!current && snapshot.revision !== undefined)
          || (current && current.browserDraftId !== snapshot.browserDraftId)) throw new PhotoDraftConflictError();
        snapshot.revision = (current?.revision ?? 0) + 1;
        if (previousKey !== snapshot.draftKey) {
          // add() also refuses to overwrite a destination created by another tab.
          store.add(snapshot); store.delete(previousKey);
        } else store.put(snapshot);
        return snapshot;
      });
      draft.revision = saved.revision;
    },
    async beginSubmission(draftKey) {
      return change(draftKey, (current, store) => {
        if (!current) throw new PhotoDraftConflictError();
        const validation = validateSubmissionManifest(current);
        if (!validation.ok) throw new Error(validation.error);
        if (!current.upload) {
          current.upload = { idempotencyKey: crypto.randomUUID(), completedPhotoIds: [] };
          current.revision = (current.revision ?? 0) + 1;
          store.put(current);
        }
        return current;
      });
    },
    async delete(draftKey) {
      await transaction("readwrite", (store) => store.delete(draftKey));
    },
    async list() {
      const entries: { key: IDBValidKey; value: unknown }[] = [];
      await transaction("readonly", (store) => {
        const request = store.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) { entries.push({ key: cursor.primaryKey, value: cursor.value }); cursor.continue(); }
        };
        return request;
      });
      const drafts: PhotoDraft[] = [], unreadableDraftKeys: IDBValidKey[] = [];
      for (const { key, value } of entries) {
        try { assertPhotoDraft(value); value.revision ??= 0; drafts.push(value); }
        catch (error) {
          if (!(error instanceof PhotoDraftCorruptionError)) throw error;
          unreadableDraftKeys.push(key);
        }
      }
      return { drafts, unreadableDraftKeys };
    },
  };
}
