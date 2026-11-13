import type { DraftPhoto, PhotoCategory } from "./photo-workflow.ts";
import type { PreparedPhoto } from "./prepare-photo.ts";
import type { UploadProgress } from "./upload-photo-draft.ts";

export type PhotoEdit = {
  image: PreparedPhoto; category: PhotoCategory; existing?: DraftPhoto;
  capturedAt: string; viewOnly?: boolean; returnFocus?: HTMLElement | null;
};
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
