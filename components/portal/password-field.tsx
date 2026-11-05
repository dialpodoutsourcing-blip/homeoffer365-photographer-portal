"use client";

import { useId, useState } from "react";
import { Check, Circle, Eye, EyeOff } from "lucide-react";
import { getPasswordRequirements, minimumPasswordLength } from "@/lib/portal/password";

export function PasswordField({ newPassword = false, disabled = false }: { newPassword?: boolean; disabled?: boolean }) {
  const id = useId();
  const requirementsId = `${id}-requirements`;
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState("");
  const requirements = getPasswordRequirements(password);
  const met = requirements.filter((requirement) => requirement.met).length;

  return <div className="portal-password-field">
    <label htmlFor={id}>{newPassword ? "New password" : "Password"}</label>
    <div className="portal-password-control">
      <input id={id} name="password" type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={disabled} minLength={newPassword ? minimumPasswordLength : undefined} autoComplete={newPassword ? "new-password" : "current-password"} autoCapitalize="none" spellCheck={false} aria-describedby={newPassword ? requirementsId : undefined} />
      <button type="button" className="portal-password-toggle" disabled={disabled} aria-label={visible ? "Hide password" : "Show password"} aria-controls={id} aria-pressed={visible} onClick={() => setVisible((previous) => !previous)}>{visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}</button>
    </div>
    {newPassword && <div className="portal-password-requirements" id={requirementsId}>
      <p>Password requirements</p>
      <ul>{requirements.map((requirement) => <li key={requirement.id} className={requirement.met ? "is-met" : ""}>{requirement.met ? <Check size={14} aria-hidden="true" /> : <Circle size={12} aria-hidden="true" />}<span><span className="sr-only">{requirement.met ? "Met: " : "Required: "}</span>{requirement.label}</span></li>)}</ul>
      <span className="sr-only" role="status" aria-live="polite">{met} of {requirements.length} password requirements met.</span>
    </div>}
  </div>;
}
