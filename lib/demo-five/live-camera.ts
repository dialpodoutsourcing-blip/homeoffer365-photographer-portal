export const CAMERA_CONSTRAINTS = { audio: false, video: { facingMode: { ideal: "environment" } } } as const;

export type CameraReviewState = { phase: "live" | "reviewing" | "saving"; file: File | null; previewUrl: string | null; error: string };
export const initialCameraReviewState: CameraReviewState = { phase: "live", file: null, previewUrl: null, error: "" };
type CameraReviewAction =
  | { type: "captured"; file: File; previewUrl: string }
  | { type: "retake" | "saveStarted" | "saveSucceeded" }
  | { type: "saveFailed"; error: string };

export function cameraReviewReducer(state: CameraReviewState, action: CameraReviewAction): CameraReviewState {
  if (action.type === "captured") return { phase: "reviewing", file: action.file, previewUrl: action.previewUrl, error: "" };
  if (action.type === "retake" || action.type === "saveSucceeded") return initialCameraReviewState;
  if (action.type === "saveStarted" && state.file) return { ...state, phase: "saving", error: "" };
  if (action.type === "saveFailed") return { ...state, phase: "reviewing", error: action.error };
  return state;
}

export async function captureVideoFrame(video: Pick<HTMLVideoElement, "videoWidth" | "videoHeight">,
  canvas: Pick<HTMLCanvasElement, "width" | "height" | "getContext" | "toBlob">, now = Date.now()): Promise<File> {
  if (!video.videoWidth || !video.videoHeight) throw new Error("The camera is not ready yet.");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not capture the camera image.");
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  context.drawImage(video as HTMLVideoElement, 0, 0, video.videoWidth, video.videoHeight);
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) throw new Error("This browser could not capture the camera image.");
  return new File([blob], `home-photo-${now}.jpg`, { type: "image/jpeg", lastModified: now });
}

export function stopMediaStream(stream: Pick<MediaStream, "getTracks"> | null | undefined) {
  stream?.getTracks().forEach(track => track.stop());
}
