export const CAMERA_CONSTRAINTS = { audio: false, video: { facingMode: { ideal: "environment" } } } as const;

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
