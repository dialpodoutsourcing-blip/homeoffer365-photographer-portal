"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { CAMERA_CONSTRAINTS, cameraReviewReducer, captureVideoFrame, initialCameraReviewState, stopMediaStream } from "@/lib/demo-five/live-camera";

export function DemoFiveLiveCamera({ onCapture, onClose }: { onCapture: (file: File) => Promise<void>; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null), stream = useRef<MediaStream | null>(null);
  const capturing = useRef(false), approving = useRef(false), mounted = useRef(true), previewUrl = useRef<string | null>(null);
  const [ready, setReady] = useState(false), [saved, setSaved] = useState(0), [cameraError, setCameraError] = useState("");
  const [review, reviewDispatch] = useReducer(cameraReviewReducer, initialCameraReviewState);

  useEffect(() => {
    mounted.current = true;
    if (!navigator.mediaDevices?.getUserMedia) { setCameraError("Live camera is unavailable in this browser. Use Upload Photos instead."); return; }
    navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS).then(value => {
      if (!mounted.current) { stopMediaStream(value); return; }
      stream.current = value;
      if (video.current) { video.current.srcObject = value; void video.current.play(); }
    }).catch(() => { if (mounted.current) setCameraError("Camera access was not allowed. Enable camera permission or use Upload Photos instead."); });
    return () => { mounted.current = false; stopMediaStream(stream.current); stream.current = null; if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); };
  }, []);

  async function shutter() {
    if (capturing.current || !video.current || !canvas.current) return;
    capturing.current = true; setCameraError("");
    try {
      const file = await captureVideoFrame(video.current, canvas.current);
      const url = URL.createObjectURL(file); previewUrl.current = url;
      if (mounted.current) reviewDispatch({ type: "captured", file, previewUrl: url });
    } catch (cause) {
      if (mounted.current) setCameraError(cause instanceof Error ? cause.message : "The photo could not be captured. Try again.");
    } finally {
      capturing.current = false;
    }
  }

  function clearPreview(type: "retake" | "saveSucceeded") {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null; reviewDispatch({ type });
  }

  async function usePhoto() {
    if (approving.current || review.phase !== "reviewing" || !review.file) return;
    approving.current = true;
    reviewDispatch({ type: "saveStarted" });
    try {
      await onCapture(review.file);
      if (mounted.current) { setSaved(value => value + 1); clearPreview("saveSucceeded"); }
    } catch (cause) {
      if (mounted.current) reviewDispatch({ type: "saveFailed", error: cause instanceof Error ? cause.message : "The photo could not be saved. Try again." });
    } finally { approving.current = false; }
  }

  return <div className="demo-five-live-camera" role="dialog" aria-modal="true" aria-labelledby="demo-five-camera-title">
    <div className="demo-five-live-camera-panel">
      <div className="demo-five-live-camera-heading"><h3 id="demo-five-camera-title">Take property photos</h3><button type="button" onClick={onClose}>Close Camera</button></div>
      <video ref={video} autoPlay muted playsInline hidden={review.phase !== "live"} onCanPlay={() => setReady(true)} aria-label="Live rear camera preview" />
      {/* Local Blob URLs cannot use the remote image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {review.previewUrl && <img className="demo-five-camera-review" src={review.previewUrl} alt="Review captured property photo" />}
      <canvas ref={canvas} hidden />
      <p role="status" aria-live="polite">{cameraError || review.error || (review.phase === "saving" ? "Saving photo…" : review.phase === "reviewing" ? "Check your photo." : saved ? `${saved} ${saved === 1 ? "photo" : "photos"} saved. Tap the shutter again.` : ready ? "Camera ready. Tap the shutter." : "Starting camera…")}</p>
      {review.phase === "live" ? <button className="demo-five-shutter" type="button" disabled={!ready || !!cameraError} onClick={() => void shutter()} aria-label="Take photo"><span /></button>
        : <div className="demo-five-camera-review-actions"><button type="button" disabled={review.phase === "saving"} onClick={() => clearPreview("retake")}>Retake</button><button type="button" disabled={review.phase === "saving"} onClick={() => void usePhoto()}>{review.phase === "saving" ? "Saving…" : "Use Photo"}</button></div>}
    </div>
  </div>;
}
