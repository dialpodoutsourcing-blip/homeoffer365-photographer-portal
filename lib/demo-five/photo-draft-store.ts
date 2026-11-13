import {
  OPTIONAL_FEATURES,
  validateDraftPhoto,
  type DraftPhoto,
  type NotApplicableSelection,
  type PhotographerDetails,
} from "./photo-workflow.ts";

export type PhotoDraft = {
  version: 1;
  draftKey: string;
  browserDraftId: string;
  propertyAddress: string;
  photographer: PhotographerDetails;
  photos: DraftPhoto[];
  notApplicable: NotApplicableSelection[];
  updatedAt: string;
};

export type PhotoDraftStore = {
  load(draftKey: string): Promise<PhotoDraft | null>;
  save(draft: PhotoDraft): Promise<void>;
  delete(draftKey: string): Promise<void>;
  list(): Promise<PhotoDraft[]>;
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

  return {
    async load(draftKey) {
      const value: unknown = await transaction("readonly", (store) => store.get(draftKey));
      if (value === undefined) return null;
      assertPhotoDraft(value);
      return value;
    },
    async save(draft) {
      const snapshot: unknown = structuredClone(draft);
      assertPhotoDraft(snapshot);
      await transaction("readwrite", (store) => store.put(snapshot));
    },
    async delete(draftKey) {
      await transaction("readwrite", (store) => store.delete(draftKey));
    },
    async list() {
      const values: unknown[] = await transaction("readonly", (store) => store.getAll());
      for (const value of values) assertPhotoDraft(value);
      return values as PhotoDraft[];
    },
  };
}
