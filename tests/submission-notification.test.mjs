import assert from "node:assert/strict";
import test from "node:test";

import { sendSubmissionNotification } from "../lib/submissions/send-submission-notification.ts";

const submission = {
  photographerName: "Ada <Lovelace>",
  email: "ada@example.com",
  phone: "+1 555-0100",
  propertyAddress: "123 Main & Market, Philadelphia, PA",
  driveLink: "https://drive.google.com/drive/folders/example?x=1&y=2",
  checklistComplete: true,
};

test("sendSubmissionNotification posts a safe team email to Resend", async () => {
  let request;
  const result = await sendSubmissionNotification(submission, {
    apiKey: "re_test_key",
    fetchImpl: async (url, init) => {
      request = { url, init };
      return Response.json({ id: "email_123" });
    },
  });

  assert.equal(result, "sent");
  assert.equal(request.url, "https://api.resend.com/emails");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers.Authorization, "Bearer re_test_key");

  const payload = JSON.parse(request.init.body);
  assert.equal(payload.from, "Home Offer 365 Photographer Portal <notifications@send.homeoffer365.com>");
  assert.deepEqual(payload.to, ["info@michaelpid.com"]);
  assert.deepEqual(payload.cc, ["dialpodoutsourcing@gmail.com"]);
  assert.equal(payload.subject, "New photographer submission — 123 Main & Market, Philadelphia, PA");
  assert.match(payload.text, /Photographer: Ada <Lovelace>/);
  assert.match(payload.text, /Checklist complete: Yes/);
  assert.match(payload.text, /Submitted at: /);
  assert.match(payload.html, /Ada &lt;Lovelace&gt;/);
  assert.match(payload.html, /123 Main &amp; Market/);
  assert.match(payload.html, /x=1&amp;y=2/);
  assert.doesNotMatch(payload.html, /Ada <Lovelace>/);
});

test("sendSubmissionNotification skips delivery when the API key is missing", async () => {
  let called = false;
  const result = await sendSubmissionNotification(submission, {
    fetchImpl: async () => {
      called = true;
      return Response.json({ id: "unexpected" });
    },
  });

  assert.equal(result, "skipped");
  assert.equal(called, false);
});

test("sendSubmissionNotification rejects unsuccessful Resend responses", async () => {
  await assert.rejects(
    sendSubmissionNotification(submission, {
      apiKey: "re_test_key",
      fetchImpl: async () => Response.json({ message: "private provider detail" }, { status: 422 }),
    }),
    /Resend rejected the notification request/,
  );
});

test("sendSubmissionNotification preserves network failures for the route to handle", async () => {
  await assert.rejects(
    sendSubmissionNotification(submission, {
      apiKey: "re_test_key",
      fetchImpl: async () => { throw new Error("network unavailable"); },
    }),
    /network unavailable/,
  );
});
