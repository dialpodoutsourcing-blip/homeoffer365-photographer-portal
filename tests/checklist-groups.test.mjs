import test from "node:test";
import assert from "node:assert/strict";

import { checklistGroupsComplete } from "../lib/submissions/checklist-groups.ts";

function groupData(checkedIndexes) {
  const values = new Map(checkedIndexes.map((index) => [`checklistGroup-${index}`, "on"]));
  return { get: (name) => values.get(name) ?? null };
}

test("checklist groups are complete only when every group is checked", () => {
  assert.equal(checklistGroupsComplete(groupData([0, 1, 2, 3, 4])), true);
  assert.equal(checklistGroupsComplete(groupData([0, 1, 2, 3])), false);
  assert.equal(checklistGroupsComplete(groupData([])), false);
});
