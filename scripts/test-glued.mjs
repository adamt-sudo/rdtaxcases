// Tests for the footnote-number detector of the case check (GLUED in scripts/lib/check.mjs): it must fire on a number stuck to the text
// before it, and stay quiet on formulas, constants, versions, hashes, years, amounts and citations.
import assert from "node:assert/strict";
import { GLUED } from "./lib/check.mjs";

const hits = (s) => s.match(new RegExp(GLUED.source, "g")) ?? [];
let groups = 0;
const group = (name, fn) => {
  fn();
  groups++;
};

group("a footnote number stuck to the text is found", () => {
  assert.equal(hits("the decision (Smith v. The Queen, 1997)3 was upheld").length, 1);
  assert.equal(hits("the Minister reassessed the holdings3 and the appeal.").length, 1);
  assert.equal(hits('the court called it "routine"3 and dismissed').length, 1);
  assert.equal(hits("as held in [1998] 3 C.T.C. 2520]12 and later").length, 1);
});

group("real notation is left alone", () => {
  for (const ok of [
    "intermetallic phases (Fe2Al5 and FeAl3)",
    "stiffness F(δ) = k1 · δ + k3 · δ³, with k1 = 1.8 kN/mm",
    "a p99 latency of 38 ms and p99.9 under 5 ms",
    "Prototype v1.2 and Rotor_v1.14 were tested",
    "HL7 v2 and FHIR R4 feeds",
    'a spreadsheet listing "40 Optimization Trials" without dates',
    "commit a4f89c1 on branch exp-01",
    "In 2021 TCC 18 the Court held that section 37(1)(a) and paragraph 248(1)(c) apply to $1,454,874 or 15% of the claim (2023 TCC 108).",
    "the 1998 CanLII 553 (TCC) decision of May 1, 1998, docket 97-531(IT)G",
  ]) assert.deepEqual(hits(ok), [], ok);
});

console.log(`footnote number detector: ${groups} groups of tests passed`);
