import test from "node:test";
import assert from "node:assert/strict";
import { PROFILES, calcCarbon, buildEsgReport } from "./carbon.mjs";

test("calcCarbon computes Scope 1/2/3 totals accurately", () => {
  const r = calcCarbon(PROFILES.student_commuter);
  const sumScopes = +(r.scopes.scope1Kg + r.scopes.scope2Kg + r.scopes.scope3Kg).toFixed(2);
  assert.ok(Math.abs(sumScopes - r.totalAnnualKg) < 0.05);
  assert.ok(r.levers.length >= 2);
  assert.ok(r.projectedAnnualKg < r.totalAnnualKg);
});

test("eco_champion scores Paris-Aligned rating", () => {
  const eco = calcCarbon(PROFILES.eco_champion);
  assert.match(eco.rating, /Paris-Aligned/);
  assert.ok(eco.perCapitaTonnes <= 2.3);
});

test("buildEsgReport produces structured markdown audit", () => {
  const r = calcCarbon(PROFILES.remote_startup);
  const md = buildEsgReport(r);
  assert.match(md, /Scope 1\/2\/3 Carbon Audit/);
  assert.match(md, /Highest-Impact Decarbonization Levers/);
});
