export type AuthAction = "signin" | "reset" | "update" | "signout";
export type AuthFeedback = { variant: "success" | "error"; title: string; message: string; button: string };

export function getAuthSuccessFeedback(action: AuthAction): AuthFeedback {
  const copy = {
    signin: { title: "Signed in successfully", message: "Welcome back. Your property workspace is ready.", button: "Continue to visits" },
    reset: { title: "Reset request received", message: "If this email has an account, a reset link will arrive shortly. Check your inbox and spam folder.", button: "Got it" },
    update: { title: "Password updated", message: "Your new password has been saved. You can continue to your visits.", button: "Continue to visits" },
    signout: { title: "Signed out", message: "You have been signed out of your workspace.", button: "Back to sign in" },
  };
  return { variant: "success", ...copy[action] };
}

export function getAuthErrorFeedback(error: unknown, action: AuthAction): AuthFeedback {
  const details = error && typeof error === "object" ? error as { code?: string; message?: string; status?: number; name?: string } : {};
  const raw = typeof details.message === "string" ? details.message : "";
  const feedback: AuthFeedback = {
    variant: "error",
    title: { signin: "Unable to sign in", reset: "Reset request unsuccessful", update: "Password not updated", signout: "Unable to sign out" }[action],
    message: raw || "Something went wrong. Please try again.",
    button: "Try again",
  };
  if (details.status === 429 || details.code === "over_request_rate_limit" || details.code === "over_email_send_rate_limit")
    return { ...feedback, title: "Please wait a moment", message: "Too many requests were made. Wait a few minutes before trying again." };
  if (action === "signin" && (details.code === "invalid_credentials" || /invalid login credentials|invalid credentials/i.test(raw)))
    return { ...feedback, title: "Incorrect email or password", message: "Please check your email address and password, then try again." };
  if (details.code === "email_not_confirmed")
    return { ...feedback, title: "Confirm your email first", message: "Confirm your email address before signing in, or contact your team for help with your account." };
  if (details.code === "captcha_failed")
    return { ...feedback, title: "Complete verification", message: "Complete the verification check, then try again. If no check is shown, ask your project owner to finish verification setup." };
  if (details.code === "weak_password")
    return { ...feedback, title: "Check your password requirements" };
  if (details.name === "AuthRetryableFetchError" || details.name === "TypeError" || /failed to fetch|network request failed/i.test(raw))
    return { ...feedback, title: "Connection problem", message: "We could not reach the account service. Check your connection and try again." };
  return feedback;
}
