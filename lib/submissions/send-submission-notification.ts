import type { SubmissionInput } from "./create-submission.ts";

type NotificationOptions = {
  apiKey?: string;
  fetchImpl?: typeof fetch;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM = "Home Offer 365 Photographer Portal <notifications@send.homeoffer365.com>";
const TO = ["info@michaelpid.com"];
const CC = ["dialpodoutsourcing@gmail.com"];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function subjectAddress(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function buildText(submission: SubmissionInput, submittedAt: string): string {
  return [
    "A photographer submission was saved.",
    "",
    `Photographer: ${submission.photographerName}`,
    `Email: ${submission.email}`,
    `Phone: ${submission.phone}`,
    `Property: ${submission.propertyAddress}`,
    `Google Drive: ${submission.driveLink}`,
    `Checklist complete: ${submission.checklistComplete ? "Yes" : "No"}`,
    `Submitted at: ${submittedAt}`,
  ].join("\n");
}

function buildHtml(submission: SubmissionInput, submittedAt: string): string {
  const rows = [
    ["Photographer", submission.photographerName],
    ["Email", submission.email],
    ["Phone", submission.phone],
    ["Property", submission.propertyAddress],
    ["Google Drive", submission.driveLink],
    ["Checklist complete", submission.checklistComplete ? "Yes" : "No"],
    ["Submitted at", submittedAt],
  ];

  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#102a3a"><h1 style="font-size:20px">New photographer submission</h1><p>A photographer submission was saved.</p><table style="border-collapse:collapse">${rows.map(([label, value]) => `<tr><th style="padding:6px 12px 6px 0;text-align:left;vertical-align:top">${escapeHtml(label)}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`).join("")}</table></body></html>`;
}

export async function sendSubmissionNotification(
  submission: SubmissionInput,
  options: NotificationOptions = {},
): Promise<"sent" | "skipped"> {
  const apiKey = options.apiKey?.trim();
  if (!apiKey) return "skipped";

  const submittedAt = new Date().toISOString();
  const response = await (options.fetchImpl ?? fetch)(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: TO,
      cc: CC,
      subject: `New photographer submission — ${subjectAddress(submission.propertyAddress)}`,
      html: buildHtml(submission, submittedAt),
      text: buildText(submission, submittedAt),
    }),
  });

  if (!response.ok) throw new Error("Resend rejected the notification request.");
  return "sent";
}
