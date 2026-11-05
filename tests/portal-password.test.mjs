import { test } from "node:test";
import assert from "node:assert/strict";
import { getPasswordRequirements, isValidNewPassword } from "../lib/portal/password.ts";

test("new passwords require all five rules, with an eight-character boundary", () => {
  assert.equal(isValidNewPassword("Aa1!aaaa"), true);
  assert.equal(isValidNewPassword("Aa1!aaa"), false);
  for (const password of ["", "aa1!aaaa", "AA1!AAAA", "AaA!aaaa", "Aa12aaaa"])
    assert.equal(isValidNewPassword(password), false);
});

test("spaces and Unicode letters do not count as Supabase special characters", () => {
  assert.equal(isValidNewPassword("Aa12 aaa"), false);
  assert.equal(isValidNewPassword("Aa12éaaa"), false);
  assert.equal(isValidNewPassword("Aa12 aaa!"), true);
  for (let code = 33; code <= 126; code++) {
    const symbol = String.fromCharCode(code);
    if (!/[A-Za-z0-9]/.test(symbol)) assert.equal(isValidNewPassword(`Aa12aaaa${symbol}`), true, symbol);
  }
});

test("requirement feedback identifies which rule needs attention", () => {
  const requirements = getPasswordRequirements("Password1");
  assert.deepEqual(requirements.filter((requirement) => !requirement.met).map((requirement) => requirement.id), ["symbol"]);
  assert.equal(requirements.length, 5);
});
