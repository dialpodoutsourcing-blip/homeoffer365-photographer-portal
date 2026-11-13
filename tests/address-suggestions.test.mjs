import test from "node:test";
import assert from "node:assert/strict";

import {
  PENNSYLVANIA_SERVICE_LOCALITIES,
  applyAddressLocality,
  findAddressLocalities,
  formatAddressLocality,
} from "../lib/address-suggestions.ts";

test("service localities contain the approved Pennsylvania markets", () => {
  assert.deepEqual(PENNSYLVANIA_SERVICE_LOCALITIES, [
    { city: "Lebanon", state: "PA", zip: "17042" },
    { city: "Harrisburg", state: "PA", zip: "17101" },
    { city: "Lancaster", state: "PA", zip: "17603" },
    { city: "Reading", state: "PA", zip: "19601" },
    { city: "York", state: "PA", zip: "17401" },
    { city: "Pottstown", state: "PA", zip: "19464" },
    { city: "Bethlehem", state: "PA", zip: "18018" },
    { city: "Easton", state: "PA", zip: "18042" },
  ]);
});

test("locality matching starts at two meaningful characters", () => {
  assert.deepEqual(findAddressLocalities(""), []);
  assert.deepEqual(findAddressLocalities("l"), []);
  assert.deepEqual(findAddressLocalities(" PA "), []);
  assert.deepEqual(findAddressLocalities("le").map(({ city }) => city), ["Lebanon"]);
});

test("locality matching accepts city and ZIP prefixes", () => {
  assert.deepEqual(findAddressLocalities("pott").map(({ city }) => city), ["Pottstown"]);
  assert.deepEqual(findAddressLocalities("123 Main St, leb").map(({ city }) => city), ["Lebanon"]);
  assert.deepEqual(findAddressLocalities("180").map(({ city }) => city), ["Bethlehem", "Easton"]);
});

test("locality matching is case insensitive and respects its limit", () => {
  assert.deepEqual(findAddressLocalities("HARR", 1), [{ city: "Harrisburg", state: "PA", zip: "17101" }]);
  assert.equal(findAddressLocalities("1", 2).length, 0);
  assert.equal(findAddressLocalities("17", 2).length, 2);
});

test("address composition appends a locality to a street", () => {
  const lebanon = PENNSYLVANIA_SERVICE_LOCALITIES[0];
  assert.equal(formatAddressLocality(lebanon), "Lebanon, PA 17042");
  assert.equal(applyAddressLocality("123 Main St", lebanon), "123 Main St, Lebanon, PA 17042");
});

test("address composition replaces a partial locality after a comma", () => {
  const lancaster = PENNSYLVANIA_SERVICE_LOCALITIES[2];
  assert.equal(applyAddressLocality("88 Market St, Lanc", lancaster), "88 Market St, Lancaster, PA 17603");
});

test("address composition preserves unmatched free-form street text", () => {
  const york = PENNSYLVANIA_SERVICE_LOCALITIES[4];
  assert.equal(applyAddressLocality("  456 West Princess Street  ", york), "456 West Princess Street, York, PA 17401");
  assert.deepEqual(findAddressLocalities("Custom Town"), []);
});
