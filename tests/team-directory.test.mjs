import { test } from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { teamDepartments, teamFounder } from "../content/company-resources.ts";

test("the team directory contains the current official roster without duplicate profiles", () => {
  const members = teamDepartments.flatMap((department) => department.members);
  const names = [teamFounder.name, ...members.map((member) => member.name)];

  assert.equal(teamFounder.name, "Michael Pid");
  assert.equal(teamFounder.role, "Founder & CEO");
  assert.equal(names.length, 17);
  assert.equal(new Set(names).size, names.length);
  assert.deepEqual(
    members.filter((member) => ["Co-Founder", "CFO / COO", "Experience Director"].includes(member.role)).map((member) => member.name),
    ["Mike", "Eric", "Ashley Sellers"],
  );
  assert.equal(members.some((member) => member.name === "Currently Hiring"), false);
});

test("every official team profile has a locally available portrait", async () => {
  const profiles = [teamFounder, ...teamDepartments.flatMap((department) => department.members)];

  for (const profile of profiles) {
    assert.match(profile.photo, /^\/images\/team\/[a-z0-9-]+\.(?:jpg|png)$/i, profile.name);
    await access(new URL(`../public${profile.photo}`, import.meta.url));
  }
});
