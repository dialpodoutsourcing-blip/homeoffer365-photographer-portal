import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("private property links enforce staff roles, scopes, revocation and submitted locks", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  const staff = "11111111-1111-4111-8111-111111111111";
  const otherStaff = "22222222-2222-4222-8222-222222222222";
  const guest = "33333333-3333-4333-8333-333333333333";
  const stranger = "44444444-4444-4444-8444-444444444444";
  const token = "a".repeat(64);
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
    insert into auth.users values ('${staff}'),('${otherStaff}'),('${guest}'),('${stranger}');
  `);
  for (const name of ["202611050001_photographer_portal.sql", "202611050002_private_visit_links.sql"])
    await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8"));
  await db.query("insert into public.portal_staff(user_id) values ($1),($2)", [staff, otherStaff]);
  const user = async (id) => {
    await db.exec("reset role; set role authenticated;");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  };
  await user(staff);
  const create = async (address) => (await db.query("insert into public.assignments(address) values ($1) returning *", [address])).rows[0];
  const visit = await create("123 Assigned Property Street");
  const unrelated = await create("456 Another Property Street");
  const link = async (value = token, id = visit.id) => db.query("select * from public.replace_visit_link($1,$2,7)", [id, value]);
  const redeem = (value = token, id = visit.id) => db.query("select * from public.redeem_visit_link($1,$2)", [id, value]);
  const save = (responses, submit = false, revision = 0) => db.query("select * from public.save_assignment($1,$2,$3::jsonb,'', $4)", [visit.id, revision, JSON.stringify(responses), submit]);
  const file = (category, id = visit.id) => db.query("insert into storage.objects(bucket_id,name,metadata) values ('property-media',$1,$2::jsonb)",
    [`${staff}/${id}/${category}/${crypto.randomUUID()}-file.jpg`, JSON.stringify({ mimetype: category === "walkthrough" ? "video/mp4" : "image/jpeg", size: 1000 })]);
  const all = Object.fromEntries((await db.query("select item_id from public.checklist_template_items where version=1")).rows.map(({ item_id }) => [item_id,"done"]));

  await t.test("staff can create links but cannot read raw token hashes", async () => {
    assert.equal((await db.query("select public.is_portal_staff() as allowed")).rows[0].allowed, true);
    assert.equal((await link()).rows.length, 1);
    await assert.rejects(db.query("select token_hash from public.visit_links"), /permission denied/);
    await assert.rejects(link("short"), /Invalid link/);
    await user(otherStaff);
    await assert.rejects(link(), /Staff access/);
    await assert.rejects(db.query("select public.revoke_visit_links($1)", [visit.id]), /Staff access/);
    assert.equal((await db.query("select * from public.assignments")).rows.length, 0);
  });
  await t.test("guest session alone grants no property access or staff privileges", async () => {
    await user(guest);
    assert.equal((await db.query("select public.is_portal_staff() as allowed")).rows[0].allowed, false);
    assert.equal((await db.query("select * from public.assignments")).rows.length, 0);
    await assert.rejects(create("789 Unauthorized Street"), /row-level security/);
    await assert.rejects(db.query("insert into public.portal_staff(user_id) values ($1)", [guest]), /permission denied/);
    await assert.rejects(link(), /Staff access/);
    await assert.rejects(redeem("b".repeat(64)), /invalid, expired, or revoked/);
    await assert.rejects(redeem(token, unrelated.id), /invalid, expired, or revoked/);
    await assert.rejects(file("exterior"), /row-level security/);
  });
  await t.test("redeeming a valid link permits only its property, including private media", async () => {
    const result = await redeem();
    assert.equal(result.rows[0].id, visit.id);
    assert.deepEqual((await db.query("select id from public.assignments")).rows.map((row) => row.id), [visit.id]);
    await assert.rejects(file("exterior", unrelated.id), /row-level security/);
    await file("exterior");
    assert.equal((await save({ "0-0":"done" })).rows[0].revision, 1);
    await user(stranger);
    assert.equal((await db.query("select * from storage.objects")).rows.length, 0);
    assert.equal((await db.query("select * from public.assignments")).rows.length, 0);
    await assert.rejects(save({}), /access denied/);
  });
  await t.test("replacement immediately invalidates previously redeemed grants", async () => {
    await user(staff); await link("c".repeat(64));
    await user(guest);
    assert.equal((await db.query("select * from public.assignments")).rows.length, 0);
    await assert.rejects(redeem(), /invalid, expired, or revoked/);
    await assert.rejects(save({}), /access denied/);
    await assert.rejects(file("condition"), /row-level security/);
    assert.equal((await db.query("delete from storage.objects returning id")).rows.length, 0);
    await redeem("c".repeat(64));
  });
  await t.test("guest submission uses staff-owned media and stays read-only", async () => {
    await file("interior"); await file("mechanical"); await file("walkthrough");
    const submitted = await save(all, true, 1);
    assert.equal(submitted.rows[0].status, "submitted");
    await assert.rejects(save(all, false, 2), /read-only/);
    await assert.rejects(file("condition"), /row-level security/);
    assert.equal((await db.query("delete from storage.objects returning id")).rows.length, 0);
    assert.equal((await db.query("select * from storage.objects")).rows.length, 4);
    await user(staff);
    await assert.rejects(link("d".repeat(64)), /Submitted visits/);
    await db.query("select public.revoke_visit_links($1)", [visit.id]);
    await user(guest);
    assert.equal((await db.query("select * from storage.objects")).rows.length, 0);
  });
  await t.test("expired links and bare public requests cannot redeem access", async () => {
    await user(staff); await link("e".repeat(64), unrelated.id);
    await user(guest); await redeem("e".repeat(64), unrelated.id);
    assert.equal((await db.query("select public.can_access_assignment($1,false) as allowed", [unrelated.id])).rows[0].allowed, true);
    await db.exec("reset role;");
    await db.query("update public.visit_links set expires_at=now()-interval '1 minute' where assignment_id=$1", [unrelated.id]);
    await user(guest);
    assert.equal((await db.query("select public.can_access_assignment($1,true) as allowed", [unrelated.id])).rows[0].allowed, false);
    assert.equal((await db.query("select * from public.assignments")).rows.length, 0);
    await assert.rejects(redeem("e".repeat(64), unrelated.id), /invalid, expired, or revoked/);
    await db.exec("reset role; set role anon;");
    await assert.rejects(redeem(), /permission denied/);
  });
});
