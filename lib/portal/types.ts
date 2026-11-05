export type ResponseValue = "done" | "unavailable";
export type VisitResponses = Record<string, ResponseValue>;
export type Assignment = {
  id: string;
  owner_id: string;
  address: string;
  status: "draft" | "submitted";
  responses: VisitResponses;
  notes: string;
  revision: number;
  template_version: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};
export type VisitFile = { name: string; path: string; category: string; size: number };
export const categories = [
  { id: "exterior", label: "Exterior" },
  { id: "interior", label: "Interior" },
  { id: "mechanical", label: "Mechanical systems" },
  { id: "condition", label: "Property condition" },
  { id: "walkthrough", label: "Walkthrough video" },
] as const;
export const bucket = "property-media";
export const maxFileBytes = 50 * 1024 * 1024;
export const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];

export function validateFile(file: Pick<File, "size" | "type">, category: string) {
  if (!allowedTypes.includes(file.type)) return "Use JPG, PNG, WebP, MP4, MOV, or WebM files.";
  if (file.size <= 0 || file.size > maxFileBytes) return "Each file must be larger than zero and no more than 50 MB.";
  if ((category === "walkthrough") !== file.type.startsWith("video/")) return "Choose video for Walkthrough and photos for the other categories.";
  return null;
}
