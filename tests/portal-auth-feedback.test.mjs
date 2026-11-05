import { test } from "node:test";
import assert from "node:assert/strict";
import { getAuthErrorFeedback, getAuthSuccessFeedback } from "../lib/portal/auth-feedback.ts";

test("wrong credentials produce generic red feedback without revealing which field is wrong", () => {
  const feedback = getAuthErrorFeedback({ code: "invalid_credentials", message: "Invalid login credentials" }, "signin");
  assert.equal(feedback.variant, "error");
  assert.equal(feedback.title, "Incorrect email or password");
  assert.equal(getAuthErrorFeedback(new Error("Invalid login credentials"), "signin").title, feedback.title);
});
test("rate limits and connection errors are not mislabeled as bad credentials", () => {
  assert.equal(getAuthErrorFeedback({ status: 429 }, "signin").title, "Please wait a moment");
  assert.equal(getAuthErrorFeedback({ code: "over_email_send_rate_limit" }, "reset").variant, "error");
  assert.equal(getAuthErrorFeedback(new TypeError("Failed to fetch"), "signin").title, "Connection problem");
});
test("unconfirmed accounts and password rules receive actionable red feedback", () => {
  assert.equal(getAuthErrorFeedback({ code: "email_not_confirmed" }, "signin").title, "Confirm your email first");
  const feedback = getAuthErrorFeedback({ code: "weak_password", message: "Password needs a symbol" }, "update");
  assert.equal(feedback.title, "Check your password requirements");
  assert.equal(feedback.message, "Password needs a symbol");
});
test("all successful auth operations have green feedback", () => {
  for (const action of ["signin", "reset", "update", "signout"]) assert.equal(getAuthSuccessFeedback(action).variant, "success");
  assert.equal(getAuthSuccessFeedback("signin").button, "Continue to visits");
});
test("reset confirmation does not claim an account exists or delivery succeeded", () => {
  assert.ok(getAuthSuccessFeedback("reset").message.startsWith("If this email has an account"));
});
test("unknown failures remain red and have a usable fallback", () => {
  assert.equal(getAuthErrorFeedback(null, "signin").variant, "error");
  assert.ok(getAuthErrorFeedback({}, "update").message);
});
test("CAPTCHA failures explain verification rather than incorrect credentials", () => {
  const feedback = getAuthErrorFeedback({ code: "captcha_failed" }, "signin");
  assert.equal(feedback.variant, "error");
  assert.equal(feedback.title, "Complete verification");
});
