import { getPhotoTypeOptions, type DraftPhoto, type PhotoCategory, type PhotoType, type ValidationResult } from "./photo-workflow.ts";
import type { PhotoDraft } from "./photo-draft-store.ts";
import type { PreparedPhoto } from "./prepare-photo.ts";
import type { UploadProgress } from "./upload-photo-draft.ts";

export type PhotoEdit = {
  image: PreparedPhoto; category: PhotoCategory | ""; existing?: DraftPhoto;
  capturedAt: string; viewOnly?: boolean; returnFocus?: HTMLElement | null;
};

export type PhotoClassification = { category: PhotoCategory | ""; photoType: PhotoType | "" };
type ClassificationAction =
  | { type: "category"; category: PhotoCategory | "" }
  | { type: "photoType"; photoType: PhotoType | "" };

export function photoClassificationReducer(state: PhotoClassification, action: ClassificationAction): PhotoClassification {
  if (action.type === "photoType") return { ...state, photoType: action.photoType };
  return {
    category: action.category,
    photoType: action.category && getPhotoTypeOptions(action.category).includes(state.photoType as PhotoType) ? state.photoType : "",
  };
}

export type WizardStep = 1 | 2 | 3;
type WizardDraft = Pick<PhotoDraft, "photographer" | "propertyAddress" | "photos">;

export function validateWizardStep(step: WizardStep, draft: WizardDraft): ValidationResult<WizardStep> {
  const validText = (value: string, limit: number) => value.trim().length > 0 && value.trim().length <= limit;
  const { name, email, phone, paymentMethod, paymentUrl } = draft.photographer;
  if (step === 1) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!validText(name, 200) || !validText(normalizedEmail, 320) || !validText(phone, 50) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { ok: false, error: "Enter your name, a valid email, and phone number within their text limits." };
    }
  } else if (step === 2) {
    if (!validText(paymentMethod, 100) || !validText(paymentUrl, 2048)) {
      return { ok: false, error: "Enter a payment method and payment URL within their text limits." };
    }
    try {
      const url = new URL(paymentUrl.trim());
      if (url.protocol !== "https:" || url.username || url.password) {
        return { ok: false, error: "Payment URL must use HTTPS without embedded credentials." };
      }
    } catch {
      return { ok: false, error: "Enter a valid HTTPS payment URL." };
    }
  } else if (!validText(draft.propertyAddress, 500)) {
    return { ok: false, error: "Enter the property address within 500 characters." };
  }
  return { ok: true, value: step };
}

export function wizardStepForDraft(draft: WizardDraft): WizardStep {
  if (draft.propertyAddress.trim() || draft.photos.length > 0) return 3;
  if (!validateWizardStep(1, draft).ok) return 1;
  return validateWizardStep(2, draft).ok ? 3 : 2;
}
export type PhotoFormState = {
  busy: boolean; submitting: boolean; submitted: boolean;
  error: string; terminalFailure: boolean; progress: UploadProgress | null;
  edit: PhotoEdit | null; editorRevision: number;
};
export const initialPhotoFormState: PhotoFormState = {
  busy: false, submitting: false, submitted: false, error: "",
  terminalFailure: false, progress: null, edit: null, editorRevision: 0,
};
type Action =
  | { type: "patch"; value: Partial<Omit<PhotoFormState, "edit" | "editorRevision">> }
  | { type: "openEditor" | "captureFinished"; edit: PhotoEdit }
  | { type: "captureStarted" | "closeEditor" | "submissionStarted" | "submissionSucceeded" | "draftRestored" };

export function photoFormReducer(state: PhotoFormState, action: Action): PhotoFormState {
  switch (action.type) {
    case "patch": return { ...state, ...action.value };
    case "captureStarted":
      if (state.busy || state.submitting || state.submitted) return state;
      return { ...state, busy: true, edit: null, error: "" };
    case "captureFinished":
      if (!state.busy || state.submitting || state.submitted) return state;
      return { ...state, busy: false, edit: action.edit, editorRevision: state.editorRevision + 1 };
    case "openEditor":
      if (state.busy || state.submitting || state.submitted) return state;
      return { ...state, edit: action.edit, editorRevision: state.editorRevision + 1 };
    case "closeEditor": return { ...state, edit: null };
    case "submissionStarted":
      return { ...state, submitting: true, submitted: false, edit: null, error: "", progress: null, terminalFailure: false };
    case "submissionSucceeded":
      return { ...initialPhotoFormState, submitted: true, editorRevision: state.editorRevision + 1 };
    case "draftRestored":
      return { ...initialPhotoFormState, editorRevision: state.editorRevision + 1 };
  }
}
