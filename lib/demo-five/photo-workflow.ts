export const PHOTO_CATEGORIES = ["exterior", "interior", "mechanical", "condition"] as const;

export const PHOTO_TYPES = {
  exterior: ["front", "rear", "sides", "roof", "yard", "driveway", "outbuildings", "damage", "other"],
  interior: ["living_room", "kitchen", "hallway_room_layout", "bedroom", "bathroom", "basement", "attic", "garage", "under_sink", "damage", "other"],
  mechanical: ["hvac", "water_heater", "electrical_panel", "plumbing", "other"],
  condition: ["general_condition", "damage", "repair_needed", "other"],
} as const;

export const OPTIONAL_FEATURES = {
  exterior: ["roof", "outbuildings"],
  interior: ["basement", "attic", "garage"],
  mechanical: [],
  condition: [],
} as const;

export const PHOTO_MINIMUMS = { exterior: 4, interior: 4, mechanical: 1, condition: 1 } as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];
export type PhotoType = (typeof PHOTO_TYPES)[PhotoCategory][number];
export type ConditionStatus = "good_condition" | "damage";

export type PhotoMetadata = {
  clientPhotoId: string;
  photoName: string;
  category: PhotoCategory;
  photoType: PhotoType;
  conditionStatus: ConditionStatus;
  description: string;
  capturedAt: string;
  width: number;
  height: number;
  mimeType: "image/webp" | "image/jpeg";
  byteSize: number;
};

export type DraftPhoto = PhotoMetadata & { blob: Blob };

export type NotApplicableSelection = {
  category: PhotoCategory;
  photoType: PhotoType;
};

export type PhotographerDetails = {
  name: string;
  email: string;
  phone: string;
  paymentMethod: string;
  paymentUrl: string;
};

export type PhotoSubmissionManifest = {
  photographer: PhotographerDetails;
  propertyAddress: string;
  photos: PhotoMetadata[];
  notApplicable: NotApplicableSelection[];
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_SUBMISSION_BYTES = 500 * 1024 * 1024;
const MAX_PHOTOS = 100;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function category(value: unknown): value is PhotoCategory {
  return typeof value === "string" && Object.hasOwn(PHOTO_TYPES, value);
}

function text(value: unknown, limit: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= limit ? normalized : null;
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function getPhotoTypeOptions(value: string): readonly PhotoType[] {
  return category(value) ? PHOTO_TYPES[value] : [];
}

function validatePhotoMetadata(input: unknown): ValidationResult<PhotoMetadata> {
  if (!record(input)) return { ok: false, error: "Photo metadata is required." };
  const clientPhotoId = text(input.clientPhotoId, Number.MAX_SAFE_INTEGER);
  const photoName = text(input.photoName, 255);
  const description = input.description === undefined ? "" : typeof input.description === "string" ? input.description.trim() : null;
  const capturedAt = text(input.capturedAt, 30);
  if (!clientPhotoId || !photoName || description === null || description.length > 5000) {
    return { ok: false, error: "Each photo needs an ID, a name of up to 255 characters, and a description of up to 5000 characters." };
  }
  if (!category(input.category) || !getPhotoTypeOptions(input.category).includes(input.photoType as PhotoType)) {
    return { ok: false, error: "Choose a photo type that belongs to its category." };
  }
  if (input.conditionStatus !== "good_condition" && input.conditionStatus !== "damage") {
    return { ok: false, error: "Choose Good Condition or Damage for each photo." };
  }
  if (!capturedAt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(capturedAt)) {
    return { ok: false, error: "A valid ISO capture timestamp is required." };
  }
  const timestamp = new Date(capturedAt);
  if (!Number.isFinite(timestamp.getTime()) || timestamp.toISOString().slice(0, 19) !== capturedAt.slice(0, 19)) {
    return { ok: false, error: "A valid ISO capture timestamp is required." };
  }
  if (!positiveInteger(input.width) || !positiveInteger(input.height) || !positiveInteger(input.byteSize) || input.byteSize > MAX_PHOTO_BYTES) {
    return { ok: false, error: "Photo dimensions and size must be positive, with a maximum of 10 MiB per photo." };
  }
  if (input.mimeType !== "image/jpeg" && input.mimeType !== "image/webp") {
    return { ok: false, error: "Prepared photos must be JPEG or WebP images." };
  }
  return {
    ok: true,
    value: {
      clientPhotoId, photoName, category: input.category,
      photoType: input.photoType as PhotoType, conditionStatus: input.conditionStatus,
      description, capturedAt: timestamp.toISOString(), width: input.width,
      height: input.height, mimeType: input.mimeType, byteSize: input.byteSize,
    },
  };
}

export function validateDraftPhoto(input: unknown): ValidationResult<DraftPhoto> {
  const metadata = validatePhotoMetadata(input);
  if (!metadata.ok) return metadata;
  if (!record(input) || !(input.blob instanceof Blob) || input.blob.size === 0) {
    return { ok: false, error: "A captured image is required before saving the photo." };
  }
  return { ok: true, value: { ...metadata.value, blob: input.blob } };
}

export function countPhotosByCategory(photos: readonly Pick<PhotoMetadata, "category">[]): Record<PhotoCategory, number> {
  const counts = { exterior: 0, interior: 0, mechanical: 0, condition: 0 };
  for (const photo of photos) {
    if (category(photo.category)) counts[photo.category] += 1;
  }
  return counts;
}

export function validatePhotoMinimums(photos: readonly Pick<PhotoMetadata, "category">[]): ValidationResult<Record<PhotoCategory, number>> {
  const counts = countPhotosByCategory(photos);
  if (PHOTO_CATEGORIES.some((item) => counts[item] < PHOTO_MINIMUMS[item])) {
    return { ok: false, error: "Add at least 4 Exterior, 4 Interior, 1 Mechanical, and 1 Condition photos." };
  }
  return { ok: true, value: counts };
}

export function validateSubmissionManifest(input: unknown): ValidationResult<PhotoSubmissionManifest> {
  if (!record(input) || !record(input.photographer) || !Array.isArray(input.photos) || !Array.isArray(input.notApplicable)) {
    return { ok: false, error: "Photographer details, photos, and N/A selections are required." };
  }
  const name = text(input.photographer.name, 200);
  const email = text(input.photographer.email, 320)?.toLowerCase();
  const phone = text(input.photographer.phone, 50);
  const paymentMethod = text(input.photographer.paymentMethod, 100);
  const paymentUrl = text(input.photographer.paymentUrl, 2048);
  const propertyAddress = text(input.propertyAddress, 500);
  if (!name || !email || !phone || !paymentMethod || !paymentUrl || !propertyAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Complete all photographer, payment, and property address fields within their text limits." };
  }
  try {
    const url = new URL(paymentUrl);
    if (url.protocol !== "https:" || url.username || url.password) {
      return { ok: false, error: "Payment URL must use HTTPS without embedded credentials." };
    }
  } catch {
    return { ok: false, error: "Enter a valid HTTPS payment URL." };
  }
  if (input.photos.length > MAX_PHOTOS) return { ok: false, error: "A submission may contain at most 100 photos." };
  const photos: PhotoMetadata[] = [];
  const photoIds = new Set<string>();
  let totalBytes = 0;
  for (const item of input.photos) {
    const result = validatePhotoMetadata(item);
    if (!result.ok) return result;
    if (photoIds.has(result.value.clientPhotoId)) return { ok: false, error: "Each photo must have a unique client photo ID." };
    photoIds.add(result.value.clientPhotoId);
    photos.push(result.value);
    totalBytes += result.value.byteSize;
  }
  if (totalBytes > MAX_SUBMISSION_BYTES) return { ok: false, error: "Total photo size may not exceed 500 MiB." };
  const minimums = validatePhotoMinimums(photos);
  if (!minimums.ok) return minimums;
  const notApplicable: NotApplicableSelection[] = [];
  const selections = new Set<string>();
  for (const selection of input.notApplicable) {
    if (!record(selection) || !category(selection.category) || !(OPTIONAL_FEATURES[selection.category] as readonly unknown[]).includes(selection.photoType)) {
      return { ok: false, error: "N/A selections must identify an optional feature in its correct category." };
    }
    const key = `${selection.category}:${selection.photoType}`;
    if (selections.has(key)) return { ok: false, error: "N/A selections must not be duplicated." };
    selections.add(key);
    notApplicable.push({ category: selection.category, photoType: selection.photoType as PhotoType });
  }
  return {
    ok: true,
    value: { photographer: { name, email, phone, paymentMethod, paymentUrl }, propertyAddress, photos, notApplicable },
  };
}
