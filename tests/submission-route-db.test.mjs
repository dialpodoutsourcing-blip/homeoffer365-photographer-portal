import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

import { handleSubmission } from "../lib/submissions/route-handler.ts";

const payload = {
  photographerName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "555-123-4567",
  propertyAddress: "123 Main Street, Philadelphia, PA 19103",
  driveLink: "https://drive.google.com/drive/folders/example",
  checklistComplete: true,
};

function request(body) {
  return new Request("http://localhost/api/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("submission route returns 201 only after a valid insert", async () => {
  const rows = [];
  const events = [];
  const response = await handleSubmission(request(payload), {
    env: { RESEND_API_KEY: "re_test_key" },
    insert: async (submission) => { events.push("insert"); rows.push(submission); },
    notify: async (submission, options) => {
      events.push("notify");
      assert.equal(submission.email, "ada@example.com");
      assert.equal(options.apiKey, "re_test_key");
      return "sent";
    },
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, "ada@example.com");
  assert.deepEqual(events, ["insert", "notify"]);
});

test("submission route safely reports malformed, unconfigured, and failed requests", async () => {
  let notifications = 0;
  const notify = async () => { notifications += 1; return "sent"; };
  const malformed = await handleSubmission(request("{"), { insert: async () => {}, notify });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: "Enter valid submission details." });

  const invalid = await handleSubmission(request({ ...payload, email: "invalid" }), { insert: async () => {}, notify });
  assert.equal(invalid.status, 400);

  const unconfigured = await handleSubmission(request(payload), { env: {} });
  assert.equal(unconfigured.status, 503);
  assert.deepEqual(await unconfigured.json(), { error: "Submissions are temporarily unavailable." });

  const failed = await handleSubmission(request(payload), {
    insert: async () => { throw new Error("private database detail"); },
    notify,
  });
  assert.equal(failed.status, 500);
  assert.deepEqual(await failed.json(), { error: "We could not save your submission. Please try again." });
  assert.equal(notifications, 0);
});

test("submission route succeeds and logs no private data when notification fails", async () => {
  const logs = [];
  const response = await handleSubmission(request(payload), {
    insert: async () => {},
    notify: async () => { throw new Error("provider failure for ada@example.com"); },
    logError: (message) => logs.push(message),
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
  assert.deepEqual(logs, ["Photographer submission notification failed."]);
  assert.doesNotMatch(logs.join(" "), /ada@example\.com|provider failure/);
});

test("submission migration stores valid rows and grants clients no table privileges", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec("create role anon; create role authenticated;");
  const migration = await readFile(
    new URL("../supabase/migrations/202611120001_photographer_submissions.sql", import.meta.url),
    "utf8",
  );
  await db.exec(migration);

  await db.query(
    `insert into public.photographer_submissions
      (photographer_name,email,phone,property_address,drive_link,checklist_complete)
     values ($1,$2,$3,$4,$5,$6)`,
    [payload.photographerName, payload.email, payload.phone, payload.propertyAddress, payload.driveLink, true],
  );
  assert.equal((await db.query("select count(*)::int as count from public.photographer_submissions")).rows[0].count, 1);
  await assert.rejects(
    db.query("insert into public.photographer_submissions (photographer_name,email,phone,property_address,drive_link) values ('A','a@example.com','1','Address','https://example.com')"),
    /check constraint/,
  );
  await db.exec("set role anon;");
  await assert.rejects(db.query("select * from public.photographer_submissions"), /permission denied/);
  await assert.rejects(
    db.query("insert into public.photographer_submissions (photographer_name,email,phone,property_address,drive_link) values ('A','a@example.com','1','Address','https://drive.google.com/folder')"),
    /permission denied/,
  );
});
