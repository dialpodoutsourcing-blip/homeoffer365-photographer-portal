import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test, { before, after } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { CONDITION_STATUSES, PHOTO_TYPES } from "../lib/demo-five/photo-workflow.ts";

const migrationUrl = new URL("../supabase/migrations/202611130001_demo_five_photo_uploads.sql", import.meta.url);
const sampleTypesMigrationUrl = new URL("../supabase/migrations/202611130002_demo_five_sample_photo_types.sql", import.meta.url);
const conditionStatusesMigrationUrl = new URL("../supabase/migrations/202611130003_demo_five_condition_statuses.sql", import.meta.url);
let db;
let migration;
let sampleTypesMigration;
let conditionStatusesMigration;
const bootstrap = `create role anon; create role authenticated; create role service_role;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);`;

before(async () => {
  migration = await readFile(migrationUrl, "utf8");
  sampleTypesMigration = await readFile(sampleTypesMigrationUrl, "utf8");
  conditionStatusesMigration = await readFile(conditionStatusesMigrationUrl, "utf8");
  db = new PGlite();
  await db.exec(bootstrap);
  await db.exec(migration);
  await db.exec(sampleTypesMigration);
  await db.exec(conditionStatusesMigration);
});
after(async () => { await db?.close(); });

async function session(photos = validPhotos(), options = {}) {
  const photographerId = randomUUID();
  const sessionId = randomUUID();
  const key = randomUUID();
  await db.query(`insert into photographers (id,name,email,phone,payment_method,payment_url)
    values ($1,'Photographer',$2,'123','Invoice','https://example.com/pay')`, [photographerId, `${photographerId}@example.com`]);
  await db.query(`insert into photographer_upload_sessions
    (id,photographer_id,property_address,idempotency_key,expected_paths,expires_at,status)
    values ($1,$2,'123 Example Street',$3,$4,$5,$6)`,
  [sessionId, photographerId, key, JSON.stringify(photos.map(({ clientPhotoId, objectPath }) => ({ clientPhotoId, objectPath }))),
    options.expired ? "2000-01-01T00:00:00Z" : "2099-01-01T00:00:00Z", options.status ?? "prepared"]);
  return { sessionId, photographerId, key, photos };
}

function validPhotos() {
  return ["exterior", "exterior", "exterior", "exterior", "interior", "interior", "interior", "interior", "mechanical", "condition"].map((category, index) => ({
    clientPhotoId: `photo-${index}`, objectPath: `session/photo-${index}.webp`, photoName: `Photo ${index}`,
    category, photoType: { exterior: "front", interior: "kitchen", mechanical: "hvac", condition: "general_condition" }[category],
    conditionStatus: "good_condition", description: "", capturedAt: "2026-11-13T12:00:00.000Z",
    width: 1200, height: 900, mimeType: "image/webp", byteSize: 1000,
  }));
}

async function finalize(s, photos = s.photos, na = [], key = s.key) {
  return (await db.query("select public.finalize_photographer_upload_session($1,$2,$3,$4) as result",
    [s.sessionId, key, JSON.stringify(photos), JSON.stringify(na)])).rows[0].result;
}

async function assertUnfinalized(s) {
  assert.equal((await db.query("select count(*)::int as count from photographer_property_photos where submission_session_id=$1", [s.sessionId])).rows[0].count, 0);
  const row = (await db.query("select status,finalized_at,finalized_photos from photographer_upload_sessions where id=$1", [s.sessionId])).rows[0];
  assert.deepEqual(row, { status: "prepared", finalized_at: null, finalized_photos: null });
}

test("fresh schema has required columns, foreign keys, private image bucket, and unique normalized email", async () => {
  const columns = (await db.query("select table_name,column_name from information_schema.columns where table_schema='public'")).rows;
  for (const [table, names] of Object.entries({
    photographers: ["id", "name", "email", "phone", "payment_method", "payment_url", "created_at", "updated_at"],
    photographer_property_photos: ["photographer_id", "photo", "photo_name", "description", "property_address", "photo_category", "photo_type", "condition_status", "submission_session_id", "client_photo_id"],
    photographer_upload_sessions: ["id", "photographer_id", "property_address", "idempotency_key", "status", "expected_paths", "prepared_manifest", "not_applicable", "expires_at", "created_at", "finalized_at"],
  })) for (const name of names) assert.ok(columns.some(row => row.table_name === table && row.column_name === name), `${table}.${name}`);
  const s = await session();
  await assert.rejects(db.query(`insert into photographers (name,email,phone,payment_method,payment_url)
    select name,' '||upper(email)||' ',phone,payment_method,payment_url from photographers where id=$1`, [s.photographerId]), /unique constraint/);
  await assert.rejects(db.query("update photographer_upload_sessions set photographer_id=$1 where id=$2", [randomUUID(), s.sessionId]), /foreign key/);
  await assert.rejects(db.query("update photographer_upload_sessions set status='unknown' where id=$1", [s.sessionId]), /check constraint/);
  const second = await session();
  await assert.rejects(db.query("update photographer_upload_sessions set idempotency_key=$1 where id=$2", [s.key, second.sessionId]), /unique constraint/);
  assert.deepEqual((await db.query("select public,file_size_limit::int,allowed_mime_types from storage.buckets where id='photographer-photos'")).rows[0],
    { public: false, file_size_limit: 10485760, allowed_mime_types: ["image/jpeg", "image/webp"] });
  assert.match(migration, /photographer-photos[\s\S]*false[\s\S]*image\/jpeg[\s\S]*image\/webp/i);
});

test("database classification accepts every selectable photo type and preserves legacy types", async () => {
  const photographerId = randomUUID();
  await db.query(`insert into photographers (id,name,email,phone,payment_method,payment_url)
    values ($1,'Classification',$2,'123','Invoice','https://example.com/pay')`, [photographerId, `${photographerId}@example.com`]);
  const legacy = { exterior: ["sides", "roof", "yard", "driveway", "outbuildings", "damage"], interior: ["bedroom", "under_sink", "damage"], mechanical: ["hvac", "electrical_panel", "plumbing"], condition: [] };
  for (const category of Object.keys(PHOTO_TYPES)) {
    for (const photoType of [...PHOTO_TYPES[category], ...legacy[category]]) {
      await db.query(`insert into photographer_property_photos
        (photographer_id,property_address,photo,photo_name,description,photo_category,photo_type,condition_status)
        values ($1,'123 Example Street',$2,$3,'',$4,$5,'good_condition')`,
      [photographerId, `${category}-${photoType}.webp`, photoType, category, photoType]);
    }
  }
});

test("database classification accepts every inspector condition status and rejects invented statuses", async () => {
  const photographerId = randomUUID();
  await db.query(`insert into photographers (id,name,email,phone,payment_method,payment_url)
    values ($1,'Conditions',$2,'123','Invoice','https://example.com/pay')`, [photographerId, `${photographerId}@example.com`]);
  for (const conditionStatus of CONDITION_STATUSES) {
    await db.query(`insert into photographer_property_photos
      (photographer_id,property_address,photo,photo_name,description,photo_category,photo_type,condition_status)
      values ($1,'123 Example Street',$2,$3,'','condition','general_condition',$4)`,
    [photographerId, `${conditionStatus}.webp`, conditionStatus, conditionStatus]);
  }
  await assert.rejects(db.query(`insert into photographer_property_photos
    (photographer_id,property_address,photo,photo_name,description,photo_category,photo_type,condition_status)
    values ($1,'123 Example Street','excellent.webp','Excellent','','condition','general_condition','excellent')`, [photographerId]), /check constraint/);
});

test("migration preserves populated owner tables and can be applied again", async (t) => {
  const legacy = new PGlite();
  t.after(() => legacy.close());
  await legacy.exec(bootstrap + `
    create table photographers (id uuid primary key default gen_random_uuid(),name text not null,email text not null,phone text not null,payment_method text not null,payment_url text not null,created_at timestamptz default now(),updated_at timestamptz default now());
    create unique index owner_email on photographers(lower(btrim(email)));
    create table photographer_property_photos (id uuid primary key default gen_random_uuid(),photographer_id uuid not null references photographers(id) on update cascade on delete cascade,property_address text not null,photo text not null,photo_name text not null,description text not null default '',photo_category text not null check(photo_category in ('exterior','interior','mechanical','condition','other')),created_at timestamptz default now(),updated_at timestamptz default now());
    insert into photographers (name,email,phone,payment_method,payment_url) values ('Legacy','legacy@example.com','123','Invoice','https://example.com');
    insert into photographer_property_photos (photographer_id,property_address,photo,photo_name,photo_category) select id,'Old address','legacy.jpg','Legacy photo','other' from photographers;
    alter table photographers enable row level security;
    alter table photographer_property_photos enable row level security;
    grant all on photographers,photographer_property_photos to anon,authenticated;
  `);
  await legacy.exec(migration);
  await legacy.exec(sampleTypesMigration);
  await legacy.exec(conditionStatusesMigration);
  await legacy.exec(migration);
  await legacy.exec(sampleTypesMigration);
  await legacy.exec(conditionStatusesMigration);
  assert.deepEqual((await legacy.query("select photo_name,photo_category,photo_type,condition_status from photographer_property_photos")).rows,
    [{ photo_name: "Legacy photo", photo_category: "other", photo_type: null, condition_status: null }]);
  assert.equal((await legacy.query("select has_table_privilege('anon','photographers','SELECT') as allowed")).rows[0].allowed, false);
});

test("RLS and privileges prevent browser access while service role can finalize", async () => {
  for (const table of ["photographers", "photographer_property_photos", "photographer_upload_sessions"]) {
    assert.equal((await db.query("select relrowsecurity from pg_class where oid=$1::regclass", [table])).rows[0].relrowsecurity, true);
    for (const role of ["anon", "authenticated"]) {
      assert.equal((await db.query("select has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE') as allowed", [role, table])).rows[0].allowed, false);
    }
  }
  const signature = "public.finalize_photographer_upload_session(uuid,uuid,jsonb,jsonb)";
  for (const role of ["anon", "authenticated", "service_role"]) {
    assert.equal((await db.query("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, signature])).rows[0].allowed, role === "service_role");
  }
  const s = await session();
  await db.exec("set role service_role");
  try { assert.equal((await finalize(s)).photoCount, 10); } finally { await db.exec("reset role"); }
});

test("finalize stores every real photo and N/A, with an identical retry returning the same result", async () => {
  const s = await session();
  const na = [{ category: "exterior", photoType: "roof" }, { category: "interior", photoType: "attic" }];
  const expected = { submissionId: s.sessionId, photographerId: s.photographerId, photoCount: 10 };
  assert.deepEqual(await finalize(s, s.photos, na), expected);
  assert.deepEqual(await finalize(s, s.photos, na), expected);
  const state = (await db.query("select status,not_applicable,finalized_at is not null as finalized from photographer_upload_sessions where id=$1", [s.sessionId])).rows[0];
  assert.deepEqual(state, { status: "finalized", not_applicable: na, finalized: true });
  const rows = (await db.query("select photo,photo_type,condition_status from photographer_property_photos where submission_session_id=$1 order by client_photo_id", [s.sessionId])).rows;
  assert.equal(rows.length, 10);
  assert.deepEqual(rows[0], { photo: "session/photo-0.webp", photo_type: "front", condition_status: "good_condition" });
  await assert.rejects(finalize(s, s.photos.map((p, i) => i ? p : { ...p, description: "changed" }), na), /retry/i);
  await assert.rejects(finalize(s, s.photos, []), /retry/i);
  await assert.rejects(db.query("update photographer_property_photos set photographer_id=$1 where submission_session_id=$2", [randomUUID(), s.sessionId]), /foreign key/);
  await assert.rejects(db.query("update photographer_property_photos set client_photo_id='photo-0' where submission_session_id=$1", [s.sessionId]), /unique constraint/);
  for (const field of ["photo_type", "condition_status", "client_photo_id"]) {
    await assert.rejects(db.query(`update photographer_property_photos set ${field}=null where submission_session_id=$1`, [s.sessionId]), /constraint/);
  }
});

for (const [name, change] of [
  ["wrong object path", p => { p[0].objectPath = "someone-else/photo.webp"; }],
  ["invalid category", p => { p[0].category = "other"; }],
  ["type from another category", p => { p[0].photoType = "kitchen"; }],
  ["invalid condition status", p => { p[0].conditionStatus = "fine"; }],
  ["missing condition status", p => { delete p[0].conditionStatus; }],
  ["insufficient category counts", p => { p[0].category = "interior"; p[0].photoType = "kitchen"; }],
  ["duplicate client ID", p => { p[1].clientPhotoId = p[0].clientPhotoId; }],
  ["missing expected photo", p => { p.pop(); }],
  ["oversized photo", p => { p[0].byteSize = 10485761; }],
  ["unsupported MIME", p => { p[0].mimeType = "image/svg+xml"; }],
  ["empty photo name", p => { p[0].photoName = " "; }],
]) test(`finalize rejects ${name} without partial writes`, async () => {
  const s = await session();
  const photos = structuredClone(s.photos);
  change(photos);
  await assert.rejects(finalize(s, photos));
  await assertUnfinalized(s);
});

test("finalize rejects invalid or duplicate N/A pairs", async () => {
  const s = await session();
  for (const na of [[{ category: "exterior", photoType: "garage" }], [{ category: "mechanical", photoType: "hvac" }],
    [{ category: "exterior", photoType: "roof" }, { category: "exterior", photoType: "roof" }]]) {
    await assert.rejects(finalize(s, s.photos, na));
    await assertUnfinalized(s);
  }
});

test("expired, wrong-state, missing, and wrong-key sessions cannot finalize", async () => {
  await assert.rejects(finalize(await session(validPhotos(), { expired: true })), /expired/i);
  for (const status of ["failed", "expired"]) await assert.rejects(finalize(await session(validPhotos(), { status })), /state/i);
  const s = await session();
  await assert.rejects(finalize(s, s.photos, [], randomUUID()), /session/i);
  await assert.rejects(finalize({ ...s, sessionId: randomUUID() }), /session/i);
  await assertUnfinalized(s);
});

test("an insert error rolls back every photo and the session update", async () => {
  const s = await session();
  await db.exec(`create function fail_photo_insert() returns trigger language plpgsql as $$ begin
    if new.client_photo_id='photo-9' then raise exception 'forced insert failure'; end if; return new; end $$;
    create trigger fail_photo_insert before insert on photographer_property_photos for each row execute function fail_photo_insert();`);
  try {
    await assert.rejects(finalize(s), /forced insert failure/);
    await assertUnfinalized(s);
  } finally { await db.exec("drop trigger fail_photo_insert on photographer_property_photos; drop function fail_photo_insert();"); }
});
