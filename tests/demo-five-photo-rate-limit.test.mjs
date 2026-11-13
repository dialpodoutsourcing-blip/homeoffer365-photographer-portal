import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { createPhotoSubmissionOperations, handlePreparePhotoSubmission, handleFinalizePhotoSubmission } from "../lib/demo-five/photo-submission-service.ts";

let db;
before(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema storage; create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);`);
  await db.exec(await readFile(new URL("../supabase/migrations/202611130001_demo_five_photo_uploads.sql", import.meta.url), "utf8"));
});
after(async () => { await db?.close(); });
function dependencies() {
  const logs = [];
  // Only the network RPC is replaced: the production Supabase adapter and
  // HTTP handler call the actual migrated PostgreSQL rate-limit function.
  const operations = createPhotoSubmissionOperations({ async rpc(name, args) {
    assert.equal(name, "consume_photographer_upload_rate_limit");
    try { return { data: (await db.query(`select public.consume_photographer_upload_rate_limit($1,$2,$3) as result`,
      [args.p_subject_hash, args.p_phase, args.p_idempotency_key])).rows[0].result, error: null }; }
    catch (error) { return { data: null, error }; }
  } });
  return { operations, env: { SB_SECRET: "test-only-hmac-secret", VERCEL: "1" }, logError: value => logs.push(value), logs };
}
function request(ip, body = {}, otherHeaders = {}) {
  return new Request("https://example.com/api/demo-five/submissions", {method:"POST",headers:{...(ip === undefined ? {} : {"x-vercel-forwarded-for":ip}),...otherHeaders},body:JSON.stringify(body)});
}

test("HTTP prepare and finalize enforce durable separate thresholds and Retry-After, then reset after fifteen minutes", async () => {
  const deps = dependencies();
  for (const [handle, phase, threshold] of [[handlePreparePhotoSubmission,"prepare",10],[handleFinalizePhotoSubmission,"finalize",30]]) {
    for (let i=0;i<threshold;i++) assert.equal((await handle(request("203.0.113.10"),deps)).status,400);
    const denied = await handle(request("203.0.113.10"),deps);
    assert.equal(denied.status,429);assert.equal((await denied.json()).code,"RATE_LIMITED");
    assert.ok(Number(denied.headers.get("Retry-After")) > 0 && Number(denied.headers.get("Retry-After")) <= 900);
    assert.equal(denied.headers.get("Cache-Control"),"no-store");
    await db.query("update photographer_upload_rate_limits set window_started_at=clock_timestamp()-interval '15 minutes' where phase=$1",[phase]);
    assert.equal((await handle(request("203.0.113.10"),deps)).status,400);
  }
  const rows=(await db.query("select subject_hash,attempts from photographer_upload_rate_limits")).rows;
  assert.ok(rows.every(r=>/^[a-f0-9]{64}$/.test(r.subject_hash) && r.attempts===1));
  assert.deepEqual(deps.logs,[]);
});

test("accepted prepare session retries do not consume quota even when the client bucket is full", async () => {
  const deps=dependencies(),key=randomUUID(),person=randomUUID();
  await db.query("insert into photographers(id,name,email,phone,payment_method,payment_url) values($1,'Test','retry@example.com','123','Invoice','https://example.com')",[person]);
  await db.query("insert into photographer_upload_sessions(id,photographer_id,property_address,idempotency_key,expected_paths,expires_at) values($1,$2,'Test',$3,'[]',clock_timestamp()+interval '2 hours')",[randomUUID(),person,key]);
  for(let i=0;i<10;i++)assert.equal((await handlePreparePhotoSubmission(request("203.0.113.20"),deps)).status,400);
  assert.equal((await handlePreparePhotoSubmission(request("203.0.113.20"),deps)).status,429);
  // Invalid manifest still receives its normal validation response, not 429.
  for(let i=0;i<12;i++)assert.equal((await handlePreparePhotoSubmission(request("203.0.113.20",{idempotencyKey:key}),deps)).status,400);
  assert.equal((await handlePreparePhotoSubmission(request("203.0.113.20",{idempotencyKey:randomUUID()}),deps)).status,429);
});

test("missing, malformed and untrusted forwarding IPs share a bounded fallback without storing raw addresses", async () => {
  await db.exec("truncate photographer_upload_rate_limits");const deps=dependencies();
  const ips=[undefined,"", "not-an-ip","203.0.113.1, 203.0.113.2", "203.0.113.1:80", "fe80::1%eth0"];
  for(let i=0;i<10;i++)assert.equal((await handlePreparePhotoSubmission(request(ips[i%ips.length],{}, {"x-forwarded-for":`192.0.2.${i+1}`}),deps)).status,400);
  assert.equal((await handlePreparePhotoSubmission(request(undefined),deps)).status,429);
  const offVercel={...deps,env:{...deps.env,VERCEL:"0"}};
  assert.equal((await handlePreparePhotoSubmission(request("203.0.113.200"),offVercel)).status,429);
  const rows=(await db.query("select * from photographer_upload_rate_limits")).rows;
  assert.equal(rows.length,1);assert.match(rows[0].subject_hash,/^[a-f0-9]{64}$/);assert.doesNotMatch(JSON.stringify(rows),/192\.0|203\.0|not-an-ip|eth0/);
});

test("equivalent IPv6 addresses share a rate bucket and unrelated valid addresses do not", async () => {
  await db.exec("truncate photographer_upload_rate_limits");const deps=dependencies();
  for(let i=0;i<10;i++) assert.equal((await handlePreparePhotoSubmission(request(i%2 ? "2001:db8::1" : "2001:0db8:0:0:0:0:0:1"),deps)).status,400);
  assert.equal((await handlePreparePhotoSubmission(request("2001:db8::1"),deps)).status,429);
  assert.equal((await handlePreparePhotoSubmission(request("2001:db8::2"),deps)).status,400);
  assert.equal((await db.query("select count(*)::int as count from photographer_upload_rate_limits")).rows[0].count,2);
});

test("rate-limit RPC outage fails closed with sanitized logs and no persistence", async () => {
  const deps=dependencies();
  deps.operations.consumeRateLimit=async()=>{throw new Error("private secret 203.0.113.5 token ada@example.com address");};
  const response=await handlePreparePhotoSubmission(request("203.0.113.5"),deps);
  assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/private|secret|203\.0|token|ada@|address/);
  assert.equal(deps.logs.length,1);assert.doesNotMatch(deps.logs.join(" "),/private|secret|203\.0|token|ada@|address/);
});

test("rate-limit state and RPC deny browser access and reject malformed arguments", async () => {
  for(const role of ["anon","authenticated"]) {
    assert.equal((await db.query("select has_table_privilege($1,'photographer_upload_rate_limits','SELECT,INSERT,UPDATE,DELETE') as allowed",[role])).rows[0].allowed,false);
    assert.equal((await db.query("select has_function_privilege($1,'consume_photographer_upload_rate_limit(text,text,uuid)','EXECUTE') as allowed",[role])).rows[0].allowed,false);
  }
  assert.equal((await db.query("select relrowsecurity from pg_class where oid='photographer_upload_rate_limits'::regclass")).rows[0].relrowsecurity,true);
  assert.equal((await db.query("select has_function_privilege('service_role','consume_photographer_upload_rate_limit(text,text,uuid)','EXECUTE') as allowed")).rows[0].allowed,true);
  for(const args of [[null,"prepare"],["a".repeat(64),null],["raw-ip","prepare"],["a".repeat(64),"unknown"]])await assert.rejects(db.query("select consume_photographer_upload_rate_limit($1,$2,null)",args),/invalid rate limit/i);
});
