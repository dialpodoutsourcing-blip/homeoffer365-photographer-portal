"use client";

import { useEffect, useId, useRef } from "react";
import { CircleCheck, CircleX, X } from "lucide-react";
import type { AuthFeedback } from "@/lib/portal/auth-feedback";

export function AuthFeedbackModal({ feedback, onDismiss }: { feedback: AuthFeedback; onDismiss: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      if (element.open) element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return <dialog ref={dialog} className={`auth-feedback-dialog auth-feedback-dialog--${feedback.variant}`} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId}
    onClose={(event) => { if (!event.currentTarget.open) onDismiss(); }}
    onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="auth-feedback-content">
      <button type="button" className="auth-feedback-close" aria-label="Dismiss notification" onClick={() => dialog.current?.close()}><X size={20} aria-hidden="true" /></button>
      <span className="auth-feedback-icon">{feedback.variant === "success" ? <CircleCheck size={36} aria-hidden="true" /> : <CircleX size={36} aria-hidden="true" />}</span>
      <h2 id={titleId}>{feedback.title}</h2>
      <p id={messageId}>{feedback.message}</p>
      <button type="button" className="auth-feedback-action" onClick={() => dialog.current?.close()}>{feedback.button}</button>
    </div>
  </dialog>;
}
