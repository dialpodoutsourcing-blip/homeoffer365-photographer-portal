export const PHOTO_CATEGORIES = ["exterior", "interior", "mechanical", "condition", "other"] as const;

export const PHOTO_TYPES = {
  exterior: ["front", "front_and_driveway", "side_yard", "front_and_side_angle", "property_boundary_and_fence", "rear", "exterior_ac_condenser", "exterior_electrical_service", "front_left_curb_view", "right_side_elevation", "backyard_and_rear_elevation", "roof_soffit_and_gutters", "other"],
  interior: ["living_room", "dining_area", "hallway_room_layout", "kitchen", "kitchen_under_sink_plumbing", "primary_bedroom", "second_bedroom", "bathroom", "bathroom_vanity_plumbing", "laundry_room", "entry_foyer", "living_room_reverse_view", "dining_room_reverse_view", "kitchen_wide_view", "kitchen_appliance_wall", "kitchen_cabinets_and_counters", "primary_bedroom_reverse_view", "primary_bedroom_closet", "second_bedroom_reverse_view", "bathroom_tub_and_shower", "hallway_linen_storage", "mudroom_and_back_entry", "basement_stair_access", "laundry_reverse_view", "basement", "basement_overview", "basement_stair_landing", "foundation_walls", "floor_drain_condition", "basement_window_and_egress", "basement_storage_area", "support_beam_and_columns", "basement_exterior_exit", "attic", "garage", "other"],
  mechanical: ["furnace_and_ductwork", "modern_furnace", "water_heater", "water_softener", "well_pump_system", "breaker_panel", "main_water_shutoff", "sump_pump", "hvac_service_connections", "plumbing_distribution", "other"],
  condition: ["general_condition", "damage", "repair_needed", "other"],
  other: ["other"],
} as const;

const LEGACY_PHOTO_TYPES = {
  exterior: ["sides", "roof", "yard", "driveway", "outbuildings", "damage"],
  interior: ["bedroom", "under_sink", "damage"],
  mechanical: ["hvac", "electrical_panel", "plumbing"],
  condition: [],
  other: [],
} as const;

export const OPTIONAL_FEATURES = {
  exterior: [],
  interior: ["basement", "attic", "garage"],
  mechanical: [],
  condition: [],
  other: [],
} as const;

export const PHOTO_MINIMUMS = { exterior: 4, interior: 4, mechanical: 1, condition: 1, other: 0 } as const;
export const CONDITION_STATUSES = ["good_condition", "satisfactory", "needs_maintenance", "damage", "non_functional", "not_accessible"] as const;
export const CONDITION_STATUS_DETAILS = {
  good_condition: { label: "Good Condition", description: "Functional with no visible concerns." },
  satisfactory: { label: "Satisfactory", description: "Functional with normal wear for its age." },
  needs_maintenance: { label: "Needs Maintenance", description: "Usable, but maintenance or attention is recommended." },
  damage: { label: "Damaged", description: "Visible damage that requires repair." },
  non_functional: { label: "Non-Functional / Unusable", description: "Not working, unsafe, or not usable as intended." },
  not_accessible: { label: "Not Accessible", description: "The area or item could not be reached or its condition could not be confirmed." },
} as const satisfies Record<(typeof CONDITION_STATUSES)[number], { label: string; description: string }>;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];
type SelectablePhotoType = (typeof PHOTO_TYPES)[PhotoCategory][number];
export type PhotoType = SelectablePhotoType | (typeof LEGACY_PHOTO_TYPES)[PhotoCategory][number];
export type ConditionStatus = (typeof CONDITION_STATUSES)[number];

export const PHOTO_TYPE_LABELS: { [Type in SelectablePhotoType]: string } = {
  front: "Front exterior",
  front_and_driveway: "Front and driveway",
  side_yard: "Side yard",
  front_and_side_angle: "Front and side angle",
  property_boundary_and_fence: "Property boundary and fence",
  rear: "Rear elevation",
  exterior_ac_condenser: "Exterior AC condenser",
  exterior_electrical_service: "Exterior electrical service",
  front_left_curb_view: "Front-left curb view",
  right_side_elevation: "Right-side elevation",
  backyard_and_rear_elevation: "Backyard and rear elevation",
  roof_soffit_and_gutters: "Roof, soffit, and gutters",
  living_room: "Living Room",
  dining_area: "Dining Area",
  hallway_room_layout: "Hallway and room layout",
  kitchen: "Kitchen",
  kitchen_under_sink_plumbing: "Kitchen under-sink plumbing",
  primary_bedroom: "Primary Bedroom",
  second_bedroom: "Second Bedroom",
  bathroom: "Bathroom",
  bathroom_vanity_plumbing: "Bathroom vanity plumbing",
  laundry_room: "Laundry Room",
  entry_foyer: "Entry foyer",
  living_room_reverse_view: "Living room reverse view",
  dining_room_reverse_view: "Dining room reverse view",
  kitchen_wide_view: "Kitchen wide view",
  kitchen_appliance_wall: "Kitchen appliance wall",
  kitchen_cabinets_and_counters: "Kitchen cabinets and counters",
  primary_bedroom_reverse_view: "Primary bedroom reverse view",
  primary_bedroom_closet: "Primary bedroom closet",
  second_bedroom_reverse_view: "Second bedroom reverse view",
  bathroom_tub_and_shower: "Bathroom tub and shower",
  hallway_linen_storage: "Hallway linen storage",
  mudroom_and_back_entry: "Mudroom and back entry",
  basement_stair_access: "Basement stair access",
  laundry_reverse_view: "Laundry reverse view",
  basement: "Basement",
  basement_overview: "Basement overview",
  basement_stair_landing: "Basement stair landing",
  foundation_walls: "Foundation walls",
  floor_drain_condition: "Floor drain condition",
  basement_window_and_egress: "Basement window and egress",
  basement_storage_area: "Basement storage area",
  support_beam_and_columns: "Support beam and columns",
  basement_exterior_exit: "Basement exterior exit",
  attic: "Attic",
  garage: "Garage",
  furnace_and_ductwork: "Furnace and ductwork",
  modern_furnace: "Modern furnace",
  water_heater: "Water heater",
  water_softener: "Water softener",
  well_pump_system: "Well pump system",
  breaker_panel: "Breaker panel",
  main_water_shutoff: "Main water shutoff",
  sump_pump: "Sump pump",
  hvac_service_connections: "HVAC service connections",
  plumbing_distribution: "Plumbing distribution",
  general_condition: "General Condition",
  damage: "Damage",
  repair_needed: "Repair Needed",
  other: "Other",
};

export function getPhotoTypeLabel(value: string): string {
  return Object.hasOwn(PHOTO_TYPE_LABELS, value) ? PHOTO_TYPE_LABELS[value as SelectablePhotoType] : value === "hvac" ? "HVAC" : value.split("_").map(word => word[0].toUpperCase() + word.slice(1)).join(" ");
}

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

function conditionStatus(value: unknown): value is ConditionStatus {
  return typeof value === "string" && (CONDITION_STATUSES as readonly string[]).includes(value);
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

function validPhotoType(photoCategory: PhotoCategory, value: unknown): value is PhotoType {
  return typeof value === "string" && ((PHOTO_TYPES[photoCategory] as readonly string[]).includes(value) || (LEGACY_PHOTO_TYPES[photoCategory] as readonly string[]).includes(value));
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
  if (!category(input.category) || !validPhotoType(input.category, input.photoType)) {
    return { ok: false, error: "Choose a photo type that belongs to its category." };
  }
  if (!conditionStatus(input.conditionStatus)) {
    return { ok: false, error: "Choose a valid condition status for each photo." };
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
  const counts = { exterior: 0, interior: 0, mechanical: 0, condition: 0, other: 0 };
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
  const email = text(
    typeof input.photographer.email === "string" ? input.photographer.email.toLowerCase() : null,
    320,
  );
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
