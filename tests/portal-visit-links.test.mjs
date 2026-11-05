import { test } from "node:test";
import assert from "node:assert/strict";
import { createVisitToken, getSharedVisitPath, handleVisitHashChange, isVisitId, isVisitToken, readVisitToken } from "../lib/portal/visit-links.ts";

test("private visit tokens use 256-bit random values and strict validation", () => {
  const first = createVisitToken();
  assert.equal(isVisitToken(first), true);
  assert.notEqual(first, createVisitToken());
  for (const value of [null,"", "a".repeat(63),"z".repeat(64), "a".repeat(65)]) assert.equal(isVisitToken(value), false);
  assert.equal(readVisitToken(`#token=${first}`), first);
  assert.equal(readVisitToken("#token=invalid"), null);
});
test("pasted links accept only this website's property route with a valid token", () => {
  const origin = "https://portal.example.com";
  const path = `/photographers/visit/11111111-1111-4111-8111-111111111111#token=${"a".repeat(64)}`;
  assert.equal(getSharedVisitPath(origin + path, origin), path);
  assert.equal(getSharedVisitPath("https://other.example.com" + path, origin), null);
  assert.equal(getSharedVisitPath(origin + "/photographers/staff", origin), null);
  assert.equal(getSharedVisitPath(origin + path.split("#")[0], origin), null);
  assert.equal(getSharedVisitPath("javascript:alert(1)", origin), null);
  assert.equal(isVisitId("not-a-uuid"), false);
});

test("guest editor section navigation preserves unsaved work while new private links reopen access", () => {
  let reloads = 0;
  const reload = () => { reloads++; };
  for (const hash of ["#visit-files", "#visit-checklist", "#visit-notes", "", "#token=invalid"]) {
    handleVisitHashChange(hash, reload);
  }
  assert.equal(reloads, 0, "in-page navigation must not reload the editor");
  handleVisitHashChange(`#token=${createVisitToken()}`, reload);
  assert.equal(reloads, 1, "a newly opened private link must be revalidated");
});
