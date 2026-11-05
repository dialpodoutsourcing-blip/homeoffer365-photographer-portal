"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, LockKeyhole, LogOut, Plus, RefreshCw, UserRound } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import type { Assignment } from "@/lib/portal/types";
import { VisitEditor } from "./visit-editor";
import { VisitBrowser } from "./visit-browser";
import { WorkspaceIntro } from "./workspace-intro";
import { PasswordField } from "./password-field";
import { isValidNewPassword } from "@/lib/portal/password";
import { getAuthErrorFeedback, getAuthSuccessFeedback, type AuthFeedback } from "@/lib/portal/auth-feedback";
import { AuthFeedbackModal } from "./auth-feedback-modal";
import { StaffLinkManager } from "./staff-link-manager";
import { CaptchaVerification } from "./captcha-verification";

const supabase = getSupabase();
const captchaSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function PortalWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!supabase);
  const [recovery, setRecovery] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);
  const [authCaptcha, setAuthCaptcha] = useState("");
  const [resetCaptcha, setResetCaptcha] = useState("");
  const [authCaptchaVersion, setAuthCaptchaVersion] = useState(0);
  const [resetCaptchaVersion, setResetCaptchaVersion] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let live = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!live) return;
      setUser(data.session?.user ?? null);
      if (error) setMessage(error.message);
      setLoading(false);
    }).catch(() => { if (live) { setMessage("Could not check your session. Refresh to retry."); setLoading(false); } });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!live) return;
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") setRecovery(false);
    });
    return () => { live = false; data.subscription.unsubscribe(); };
  }, []);

  function showInvalidField(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || event.currentTarget.querySelector("input:invalid") !== input) return;
    const email = input.name === "email";
    setFeedback({
      variant: "error",
      title: email ? "Check your email address" : "Check your password",
      message: input.validity.valueMissing
        ? email ? "Enter your email address to continue." : "Enter your password to continue."
        : email ? "Enter a valid email address, such as name@company.com." : "Your new password needs at least 8 characters. Review the requirements below the password field.",
      button: "Try again",
    });
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    try {
      const password = String(form.get("password"));
      if (recovery && !isValidNewPassword(password)) {
        setFeedback(getAuthErrorFeedback({ code: "weak_password", message: "Your new password needs at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character." }, "update"));
        return;
      }
      if (recovery) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      } else {
        if (captchaSiteKey && !authCaptcha) throw { code: "captcha_failed" };
        const { data, error } = await supabase.auth.signInWithPassword({ email: String(form.get("email")).trim(), password, options: { captchaToken: authCaptcha || undefined } });
        if (error) throw error;
        if (!data.session?.user) throw new Error("Your session could not be established. Please try signing in again.");
        const { data: staff, error: staffError } = await supabase.rpc("is_portal_staff");
        if (staffError) throw new Error("Staff access is not ready. Ask your project owner to finish workspace setup.");
        if (!staff) {
          await supabase.auth.signOut({ scope: "local" });
          throw new Error("This area is for staff. Photographers should use the private property link provided by their team.");
        }
        setUser(data.session.user);
      }
      setFeedback(getAuthSuccessFeedback(recovery ? "update" : "signin"));
      setRecovery(false);
    } catch (error) { setFeedback(getAuthErrorFeedback(error, recovery ? "update" : "signin")); }
    finally { setBusy(false); setAuthCaptcha(""); setAuthCaptchaVersion((value) => value + 1); }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage("");
    try {
      const email = String(new FormData(event.currentTarget).get("email")).trim();
      if (captchaSiteKey && !resetCaptcha) throw { code: "captcha_failed" };
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/photographers/staff`, captchaToken: resetCaptcha || undefined });
      if (error) throw error;
      setFeedback(getAuthSuccessFeedback("reset"));
    } catch (error) { setFeedback(getAuthErrorFeedback(error, "reset")); }
    finally { setBusy(false); setResetCaptcha(""); setResetCaptchaVersion((value) => value + 1); }
  }

  if (!supabase) return <div className="portal-workspace"><div className="visit-auth-layout"><WorkspaceIntro /><section className="panel portal-panel portal-auth"><span className="visit-auth-icon"><LockKeyhole size={24} aria-hidden="true" /></span><span className="eyebrow">PROPERTY WORKSPACE</span><h2>Ready to connect</h2><p>Your saved visits and private uploads will be available once the project owner finishes connecting the workspace.</p><p>In the meantime, get familiar with the photo guide and practice your visit checklist.</p><div className="portal-actions"><Link href="/photographers/photo-guide" className="button primary">Explore the photo guide<ArrowRight size={16} aria-hidden="true" /></Link><Link href="/photographers/checklist" className="button secondary">Practice checklist</Link></div></section></div></div>;
  if (loading) return <div className="panel portal-panel visit-session-loading" role="status"><span className="visit-auth-icon"><LockKeyhole size={24} aria-hidden="true" /></span><h2>Opening your workspace…</h2><p>Checking your session and getting things ready.</p></div>;

  return <div className="portal-workspace">
    {feedback && <AuthFeedbackModal feedback={feedback} onDismiss={() => setFeedback(null)} />}
    {message && <p className="portal-notice" role="status">{message}</p>}
    {(!user || recovery) ? <div className="visit-auth-layout"><WorkspaceIntro /><section className="panel portal-panel portal-auth"><span className="visit-auth-icon"><LockKeyhole size={24} aria-hidden="true" /></span><span className="eyebrow">STAFF ACCESS</span><h2>{recovery ? "Choose a new password" : "Welcome back."}</h2><p>{recovery ? "Set a new password to return to your saved property visits." : "Staff can create property visits, share private links, and review submissions."}</p>
      <form className="portal-form" onSubmit={authenticate} onInvalid={showInvalidField}>
        {!recovery && <label>Email<input name="email" type="email" required autoComplete="username" maxLength={254} /></label>}
        <PasswordField key={recovery ? "new-password" : "sign-in-password"} newPassword={recovery} disabled={busy} />
        {!recovery && captchaSiteKey && <CaptchaVerification key={authCaptchaVersion} siteKey={captchaSiteKey} onToken={setAuthCaptcha} />}
        <button className="button primary" disabled={busy}>{busy ? "Please wait…" : recovery ? "Update password" : "Sign in to your workspace"}<ArrowRight size={17} aria-hidden="true" /></button>
      </form>
      {!recovery && <details className="portal-reset" onToggle={(event) => setResetOpen(event.currentTarget.open)}><summary>Forgot your password?</summary><form className="portal-form" onSubmit={resetPassword} onInvalid={showInvalidField}><label>Account email<input name="email" type="email" required autoComplete="email" /></label>{resetOpen && captchaSiteKey && <CaptchaVerification key={resetCaptchaVersion} siteKey={captchaSiteKey} onToken={setResetCaptcha} />}<button className="button secondary" disabled={busy}>Send reset link</button></form></details>}
      <p className="visit-auth-note"><LockKeyhole size={13} aria-hidden="true" />Private access for your team and assigned photographers.</p>
    </section></div> : <>
      <div className="portal-account"><div className="visit-account-identity"><span className="visit-account-avatar"><UserRound size={21} aria-hidden="true" /></span><div><span>YOUR STAFF WORKSPACE</span><strong>{user.email}</strong></div></div><button className="button secondary" disabled={busy} onClick={async () => {
        if (!window.confirm("Sign out? Save any unsaved checklist changes first.")) return;
        setBusy(true);
        try { const { error } = await supabase.auth.signOut(); if (error) throw error; setMessage(""); setFeedback(getAuthSuccessFeedback("signout")); }
        catch (error) { setFeedback(getAuthErrorFeedback(error, "signout")); }
        finally { setBusy(false); }
      }}><LogOut size={15} aria-hidden="true" />Sign out</button></div>
      <StaffAccess key={user.id} userId={user.id} />
    </>}
  </div>;
}

function StaffAccess({ userId }: { userId: string }) {
  const [access, setAccess] = useState<"checking" | "allowed" | "denied" | "setup">("checking");
  useEffect(() => {
    let live = true;
    supabase!.rpc("is_portal_staff").then(({ data, error }) => { if (live) setAccess(error ? "setup" : data ? "allowed" : "denied"); });
    return () => { live = false; };
  }, []);
  if (access === "checking") return <p role="status">Checking staff access…</p>;
  if (access !== "allowed") return <section className="panel portal-panel"><h2>{access === "setup" ? "Workspace setup is incomplete" : "Staff access required"}</h2><p>Ask your project owner to enable staff access for this account. Photographers can open the private property link supplied by their team without signing in.</p></section>;
  return <VisitWorkspace userId={userId} />;
}

function VisitWorkspace({ userId }: { userId: string }) {
  const [visits, setVisits] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState("");
  const [dirty, setDirty] = useState(false);
  const [working, setWorking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let live = true;
    async function load() {
      try {
        const visits: Assignment[] = [];
        for (let offset = 0; live; offset += 100) {
          const { data, error } = await supabase!.from("assignments").select("*").eq("owner_id", userId).order("created_at", { ascending: false }).order("id").range(offset, offset + 99);
          if (error) throw new Error(error.message);
          visits.push(...data as Assignment[]);
          if (data.length < 100) break;
        }
        if (live) { setVisits(Array.from(new Map(visits.map((visit) => [visit.id, visit])).values())); setError(""); }
      } catch (error) { if (live) setError(error instanceof Error ? error.message : "Could not load your visits."); }
      finally { if (live) setLoading(false); }
    }
    void load();
    return () => { live = false; };
  }, [userId, reload]);
  useEffect(() => {
    if (!dirty && !working) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, working]);
  const active = visits.find((visit) => visit.id === selected);

  async function createVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const address = String(new FormData(formElement).get("address")).trim();
    setBusy(true); setError("");
    try {
      const { data, error } = await supabase!.from("assignments").insert({ address }).select().single();
      if (error) throw new Error(error.message);
      setVisits((previous) => [data as Assignment, ...previous]); setSelected(data.id); setDirty(false); formElement.reset();
    } catch (error) { setError(error instanceof Error ? error.message : "Could not create the property visit."); }
    finally { setBusy(false); }
  }
  return <>
    <section className="panel portal-panel visit-library"><div className="visit-library-heading"><div><span className="eyebrow">01 / STAFF ACCESS</span><h2>A place for every visit.</h2><p>Pick up a draft, open a receipt, or start with a new address.</p></div><button className="button secondary" type="button" disabled={dirty || busy || working || loading} onClick={() => { setLoading(true); setReload((value) => value + 1); }}><RefreshCw size={15} aria-hidden="true" />Refresh</button></div>
      {loading ? <p className="visit-loading" role="status">Loading your property visits…</p> : <VisitBrowser visits={visits} selected={selected} disabled={dirty || busy || working} onSelect={setSelected} />}
      {dirty && <p className="portal-notice">You have unsaved changes. Save or discard them before changing visits.</p>}
      <form className="portal-form portal-create" onSubmit={createVisit}><label>Start a new visit<input name="address" minLength={8} maxLength={500} required placeholder="Full address: street, city, state, ZIP code" autoComplete="street-address" disabled={dirty || busy || loading || working} /></label><button className="button primary" disabled={dirty || busy || loading || working}><Plus size={17} aria-hidden="true" />{busy ? "Creating…" : "Create visit"}</button></form>
      {error && <p className="portal-error" role="alert">{error} Use Refresh to try loading your visits again.</p>}
    </section>
    {active && !loading && <VisitEditor key={active.id} client={supabase!} visit={active} tools={<StaffLinkManager visit={active} client={supabase!} disabled={dirty || working} onBusy={setWorking} />} onDirty={setDirty} onWorking={setWorking} onSaved={(visit) => { setVisits((previous) => previous.map((existing) => existing.id === visit.id ? visit : existing)); setDirty(false); }} />}
  </>;
}
