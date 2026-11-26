// Tests for the case sheet layout (scripts/lib/case-sheet.mjs): columns found by header, optional Decision date and Language columns,
// plain problems per row, and the check of a case number against its document.
import assert from "node:assert/strict";
import { checkNumber, docIdOf, headCitations, readCaseSheet } from "./lib/case-sheet.mjs";
import { loadSiteMap } from "./lib/page-address.mjs";

const siteMap = loadSiteMap();
let groups = 0;
const group = (name, fn) => {
  fn();
  groups++;
};
const DOC = "https://docs.google.com/document/d/1zdHCkCcaMD45vKBVlR63XHaNJ2ual-Bp8fM-9U-_9a4/edit";

group("the columns are found by header, in the Canada sheet's layout", () => {
  const csv = [
    '"URL","URL_LINK_6 (FINAL)","Page Title","Key Phrase","Meta Description","Case Summary","Outcome","Case Number","Tax Court","Year","Full URL","URL Live"',
    `"/ca/some-case-2020-tcc","${DOC}","Some Case (2020 TCC)","some case","A description.","One line.","Appeal allowed.","2020 TCC 5","Tax Court of Canada","2020","https://x","yes"`,
  ].join("\n");
  const { rows, missingColumns, found } = readCaseSheet(csv, siteMap);
  assert.deepEqual(missingColumns, []);
  assert.equal(found.decisionDate, false);
  assert.equal(found.language, false);
  const r = rows[0];
  assert.equal(r.cc, "ca");
  assert.equal(r.slug, "some-case-2020-tcc");
  assert.equal(r.docId, "1zdHCkCcaMD45vKBVlR63XHaNJ2ual-Bp8fM-9U-_9a4");
  assert.equal(r.subject, "One line.");
  assert.equal(r.outcome, "Appeal allowed.");
  assert.equal(r.court, "Tax Court of Canada");
  assert.equal(r.year, "2020");
  assert.deepEqual(r.problems, []);
});

group("Decision date and Language columns are read when they are there, in any order", () => {
  const csv = [
    `Language,Decision date,Year,Court,Case Number,Page Title,HTML doc,URL`,
    `fr,2021-03-04,2021,Cour du Québec,2021 QCCQ 9,Une affaire,${DOC},/ca/une-affaire-2021`,
    `xx-yy-zz-q,2021-13-45,21,,,,,/ca/Bad Slug`,
  ].join("\n");
  const { rows, found } = readCaseSheet(csv, siteMap);
  assert.equal(found.decisionDate, true);
  assert.equal(found.language, true);
  assert.deepEqual(rows[0].problems, []);
  assert.equal(rows[0].decisionDate, "2021-03-04");
  assert.equal(rows[0].language, "fr");
  const p = rows[1].problems.join(" | ");
  assert.match(p, /decision date/);
  assert.match(p, /language/);
  assert.match(p, /year/);
  assert.match(p, /court is empty/);
  assert.match(p, /case number is empty/);
  assert.match(p, /address/);
});

group("a missing required column is reported", () => {
  const { missingColumns } = readCaseSheet("URL,Page Title\n/ca/x,X", siteMap);
  assert.deepEqual(missingColumns.sort(), ["caseNumber", "court", "doc", "year"]);
});

group("a case number is checked against its document", () => {
  const doc = "<p>Buehler Versatile v. The King (2023 TCC 18) is a decision. See also 2022 FCA 1.</p>";
  assert.equal(checkNumber(doc, "2023 TCC 18"), "agrees");
  assert.equal(checkNumber(doc, "2023 TCC 24", "2023 TCC 18"), "contradicts-site");
  assert.equal(checkNumber(doc, "2023 TCC 24"), "not-in-document");
  assert.deepEqual(headCitations(doc), ["2023 TCC 18", "2022 FCA 1"]);
  assert.equal(docIdOf("not a link"), null);
});

console.log(`case sheet layout: ${groups} groups of tests passed`);
