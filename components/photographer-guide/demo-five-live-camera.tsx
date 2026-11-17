"use client";

import { useEffect, useRef, useState } from "react";
import { CAMERA_CONSTRAINTS, captureVideoFrame, stopMediaStream } from "@/lib/demo-five/live-camera";

export function DemoFiveLiveCamera({ onCapture, onClose }: { onCapture: (file: File) => Promise<void>; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null), stream = useRef<MediaStream | null>(null);
  const capturing = useRef(false), mounted = useRef(true);
  const [ready, setReady] = useState(false), [saving, setSaving] = useState(false), [saved, setSaved] = useState(0), [error, setError] = useState("");

  useEffect(() => {
    mounted.current = true;
    if (!navigator.mediaDevices?.getUserMedia) { setError("Live camera is unavailable in this browser. Use Upload Photos instead."); return; }
    navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS).then(value => {
      if (!mounted.current) { stopMediaStream(value); return; }
      stream.current = value;
      if (video.current) { video.current.srcObject = value; void video.current.play(); }
    }).catch(() => { if (mounted.current) setError("Camera access was not allowed. Enable camera permission or use Upload Photos instead."); });
    return () => { mounted.current = false; stopMediaStream(stream.current); stream.current = null; };
  }, []);

  async function shutter() {
    if (capturing.current || !video.current || !canvas.current) return;
    capturing.current = true; setSaving(true); setError("");
    try {
      const file = await captureVideoFrame(video.current, canvas.current);
      await onCapture(file);
      if (mounted.current) setSaved(value => value + 1);
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "The photo could not be saved. Try again.");
    } finally {
      capturing.current = false; if (mounted.current) setSaving(false);
    }
  }

  return <div className="demo-five-live-camera" role="dialog" aria-modal="true" aria-labelledby="demo-five-camera-title">
    <div className="demo-five-live-camera-panel">
      <div className="demo-five-live-camera-heading"><h3 id="demo-five-camera-title">Take property photos</h3><button type="button" onClick={onClose}>Close Camera</button></div>
      <video ref={video} autoPlay muted playsInline onCanPlay={() => setReady(true)} aria-label="Live rear camera preview" />
      <canvas ref={canvas} hidden />
      <p role="status" aria-live="polite">{error || (saving ? "Saving photo…" : saved ? `${saved} ${saved === 1 ? "photo" : "photos"} saved. Tap the shutter again.` : ready ? "Camera ready. Tap the shutter to save a photo." : "Starting camera…")}</p>
      <button className="demo-five-shutter" type="button" disabled={!ready || saving || !!error} onClick={() => void shutter()} aria-label="Take and save photo"><span /></button>
    </div>
  </div>;
}
