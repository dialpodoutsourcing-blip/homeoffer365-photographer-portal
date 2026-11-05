import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { checklistGroups } from "../content/photographer-guide.ts";

// Real PostgreSQL SQL/RLS execution in WASM; minimal Auth/Storage schema stubs.
// Does not emulate the hosted Auth/Storage HTTP APIs or the Storage file bytes.
test("portal migration, ownership, checklist validation and immutable submissions", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  const owner = "11111111-1111-4111-8111-111111111111";
  const other = "22222222-2222-4222-8222-222222222222";
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text unique, metadata jsonb);
    alter table storage.objects enable row level security;
    grant usage on schema auth,storage,public to anon,authenticated;
    grant select,insert,delete on storage.objects to authenticated;
    insert into auth.users values ('${owner}'),('${other}');
  `);
  await db.exec(await readFile(new URL("../supabase/migrations/202611050001_photographer_portal.sql", import.meta.url), "utf8"));
  const user = async (id = owner) => {
    await db.exec("reset role; set role authenticated;");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  };
  await user();
  const { rows: [visit] } = await db.query("insert into public.assignments(address) values ($1) returning *", ["123 Main Street, Orlando, FL 32801"]);
  const all = Object.fromEntries((await db.query("select item_id from public.checklist_template_items where version = 1")).rows.map(({ item_id }) => [item_id, "done"]));
  assert.equal(Object.keys(all).length, 19);
  const template = (await db.query("select item_id,label from public.checklist_template_items order by item_id")).rows;
  assert.deepEqual(template, checklistGroups.flatMap((group, groupIndex) => group.items.map((label, itemIndex) => ({ item_id: `${groupIndex}-${itemIndex}`, label }))));
  const save = (responses, notes = "", submit = false, revision = 0) => db.query(
    "select * from public.save_assignment($1,$2,$3::jsonb,$4,$5)", [visit.id, revision, JSON.stringify(responses), notes, submit]);
  const file = (category, mime = category === "walkthrough" ? "video/mp4" : "image/jpeg", userId = owner) => db.query(
    "insert into storage.objects(bucket_id,name,metadata) values ('property-media',$1,$2::jsonb)",
    [`${userId}/${visit.id}/${category}/${crypto.randomUUID()}-photo.jpg`, JSON.stringify({ mimetype: mime, size: 1000 })]);

  await t.test("only owners can read and edit their visits; anonymous access denied", async () => {
    await user(other);
    assert.equal((await db.query("select * from public.assignments")).rows.length, 0);
    await assert.rejects(save({}), /access denied/);
    await assert.rejects(file("exterior"), /row-level security/);
    await user();
    await assert.rejects(db.query("update public.assignments set status='submitted' where id=$1", [visit.id]), /permission denied/);
    await assert.rejects(db.query("insert into public.assignments(address,owner_id) values ('123 Other Street',$1)", [other]), /permission denied/);
    await db.exec("reset role; set role anon;");
    await assert.rejects(db.query("select * from public.assignments"), /permission denied/);
    await assert.rejects(save({}), /permission denied/);
    await user();
  });
  await t.test("reject unknown, null, forbidden and incomplete responses", async () => {
    await assert.rejects(save({ unknown: "done" }), /unknown item/);
    await assert.rejects(save({ "0-0": null }), /unknown item/);
    await assert.rejects(save({ "4-1": "unavailable" }), /unknown item/);
    await assert.rejects(save({}, "", true), /Review every/);
    await assert.rejects(save({ ...all, "0-0": "unavailable" }, "", true), /Explain unavailable/);
    await assert.rejects(save(all, "", true), /at least one property photo/);
  });
  await t.test("private files enforce visit ownership and category MIME types", async () => {
    await assert.rejects(file("walkthrough", "image/jpeg"), /row-level security/);
    await assert.rejects(file("exterior", "video/mp4"), /row-level security/);
    await assert.rejects(file("invalid"), /row-level security/);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name,metadata) values ('property-media',$1,$2::jsonb)",
      [`${owner}/${visit.id}/exterior/empty.jpg`, JSON.stringify({ mimetype: "image/jpeg", size: 0 })]), /row-level security/);
    await file("exterior");
    await user(other);
    assert.equal((await db.query("select * from storage.objects")).rows.length, 0);
    assert.equal((await db.query("delete from storage.objects returning id")).rows.length, 0);
    await user();
    assert.equal((await db.query("select * from storage.objects")).rows.length, 1);
    await assert.rejects(save(all, "", true), /Upload files for interior/);
  });
  await t.test("drafts persist and stale revisions cannot overwrite them", async () => {
    const result = await save({ "0-0": "done" }, "Side gate locked; return visit needed.");
    assert.equal(result.rows[0].revision, 1);
    assert.equal(result.rows[0].notes, "Side gate locked; return visit needed.");
    await assert.rejects(save(all), /changed in another tab/);
    const restored = (await db.query("select responses from public.assignments where id=$1", [visit.id])).rows[0];
    assert.deepEqual(restored.responses, { "0-0": "done" });
  });
  await t.test("submission requires category coverage; freezes the visit and files", async () => {
    await file("interior"); await file("mechanical");
    await assert.rejects(save(all, "", true, 1), /Upload files for walkthrough/);
    await file("walkthrough");
    const result = await save(all, "No additional condition issues observed.", true, 1);
    assert.equal(result.rows[0].status, "submitted");
    assert.ok(result.rows[0].submitted_at);
    await assert.rejects(save(all, "", false, 2), /read-only/);
    await assert.rejects(file("condition"), /row-level security/);
    assert.equal((await db.query("delete from storage.objects returning id")).rows.length, 0);
    assert.equal((await db.query("select * from storage.objects")).rows.length, 4);
  });
  await t.test("documented whole-group exceptions allow a limited accessible visit", async () => {
    const { rows: [limited] } = await db.query("insert into public.assignments(address) values ('456 Limited Access Street') returning *");
    await db.query("insert into storage.objects(bucket_id,name,metadata) values ('property-media',$1,$2::jsonb)",
      [`${owner}/${limited.id}/exterior/${crypto.randomUUID()}-front.jpg`, JSON.stringify({ mimetype: "image/jpeg", size: 1000 })]);
    const responses = Object.fromEntries(Object.keys(all).map((id) => [id, /^[123]-/.test(id) ? "unavailable" : "done"]));
    const result = await db.query("select * from public.save_assignment($1,0,$2::jsonb,$3,true)",
      [limited.id, JSON.stringify(responses), "Homeowner could not provide interior access. Interior, mechanical systems and video unavailable; no exterior damage visible."]);
    assert.equal(result.rows[0].status, "submitted");
  });
});
