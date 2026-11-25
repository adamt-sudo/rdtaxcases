// Import or update the cases of a country from its case sheet (layout: scripts/lib/case-sheet.mjs).
//
//   node scripts/import-case-sheet.mjs --csv sheet.csv --docs <folder of <doc id>.txt> [--hold 12,13] [--overrides file.json]
//                                      [--apply-contradicting] [--report report.json] [--write]
//
// For every row (without --write nothing is saved):
//   - a case that is not on the site yet is CREATED from its Google Doc (the same pipeline as scripts/import-batch.mjs), with the sheet's
//     case number, court, year, summary (the subject), outcome and, if the sheet has the columns, decision date and language;
//   - a case that is on the site is UPDATED: the sheet's case number, court, year, subject, outcome (and decision date, language, title,
//     key phrase, meta description when they differ). Its text is not touched.
//   - GUARD: when the document contains the number the site has now and does not contain the sheet's number, the sheet's number is
//     probably another decision's. Then the number, court and year are kept (the rest is updated) and the row is listed, unless
//     --apply-contradicting is given.
//   - --hold 12,13: rows (sheet line numbers) that are not touched at all, because the owner is still confirming them.
//   - --overrides: { "96": { "court": "...", "note": "why" } } corrects a field of a row for this run (the note is reported).
// Only cases of other countries are handled (the address /xx/<slug>); the USA cases are matched by name with import-batch.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadSiteMap } from "./lib/page-address.mjs";
import { checkNumber, headCitations, readCaseSheet } from "./lib/case-sheet.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const write = args.includes("--write");
const applyContradicting = args.includes("--apply-contradicting");
if (!opt("--csv") || !opt("--docs")) {
  console.error("Usage: node scripts/import-case-sheet.mjs --csv sheet.csv --docs <folder> [--hold 12,13] [--overrides file.json] [--apply-contradicting] [--report r.json] [--write]");
  process.exit(1);
}

const siteMap = loadSiteMap();
const { rows, missingColumns, found } = readCaseSheet(fs.readFileSync(opt("--csv"), "utf8"), siteMap);
if (missingColumns.length) {
  console.error(`The sheet has no column for: ${missingColumns.join(", ")}.`);
  process.exit(1);
}
const hold = new Set((opt("--hold") ?? "").split(",").map((x) => x.trim()).filter(Boolean).map(Number));
const overrides = opt("--overrides") ? JSON.parse(fs.readFileSync(opt("--overrides"), "utf8")) : {};
const docsDir = opt("--docs");
const result = { created: [], updated: [], unchanged: [], held: [], flagged: [], problems: [] };
const flag = (r, kind, text) => result.flagged.push({ line: r.line, title: r.title, kind, text });
const toCreate = [];

for (const r0 of rows) {
  const ov = overrides[String(r0.line)] ?? {};
  const r = { ...r0, ...Object.fromEntries(Object.entries(ov).filter(([k]) => k !== "note")) };
  if (ov.note) flag(r, "corrected for this run", ov.note);
  if (r.cc === "us") {
    result.held.push({ line: r.line, title: r.title, reason: "a USA case: matched by name with scripts/import-batch.mjs, not here" });
    continue;
  }
  if (hold.has(r.line)) {
    result.held.push({ line: r.line, title: r.title, reason: "not touched: the owner is still confirming this row" });
    continue;
  }
  if (r.problems.length) {
    result.held.push({ line: r.line, title: r.title, reason: r.problems.join("; ") });
    continue;
  }
  const docFile = path.join(docsDir, `${r.docId}.txt`);
  if (!fs.existsSync(docFile)) {
    result.held.push({ line: r.line, title: r.title, reason: `the document ${r.docId} was not downloaded to ${docsDir}` });
    continue;
  }
  const doc = fs.readFileSync(docFile, "utf8");
  const file = path.join(ROOT, "content", "cases", `${r.slug}.json`);
  const year = Number(r.year);
  const numberYear = (r.caseNumber.match(/^(\d{4}) [A-Z]+ \d+$/) || [])[1];
  if (numberYear && Number(numberYear) !== year) flag(r, "year differs", `the year column says ${year}, the case number ${r.caseNumber} says ${numberYear}`);

  if (!fs.existsSync(file)) {
    const verdict = checkNumber(doc, r.caseNumber);
    if (verdict !== "agrees") flag(r, "number not in the document", `sheet: ${r.caseNumber}; the document's first lines cite: ${headCitations(doc).join(", ") || "no case number"}`);
    toCreate.push({
      type: "case",
      title: r.title,
      address: r.address,
      id: r.docId,
      sheetTitle: true,
      ...(r.keyPhrase ? { keyPhrase: r.keyPhrase } : {}),
      ...(r.description ? { sheetDescription: r.description } : {}),
      create: {
        title: r.title,
        caseNumber: r.caseNumber,
        court: r.court,
        year,
        ...(found.decisionDate && r.decisionDate ? { decisionDate: r.decisionDate } : {}),
        subject: r.subject || r.title,
        ...(r.outcome ? { outcome: r.outcome } : {}),
        ...(found.language && r.language ? { language: r.language } : {}),
        jurisdictionGroup: "country",
        jurisdictionSlug: r.cc,
        country: r.cc.toUpperCase(),
      },
      _line: r.line,
    });
    continue;
  }

  const cur = JSON.parse(fs.readFileSync(file, "utf8"));
  const verdict = checkNumber(doc, r.caseNumber, cur.caseNumber);
  const keep = verdict === "contradicts-site" && !applyContradicting;
  if (verdict === "contradicts-site") {
    flag(r, keep ? "number kept" : "number replaced", `the site has ${cur.caseNumber} (the document says so); the sheet says ${r.caseNumber} (${r.court}, ${r.year}), which is not in the document. The document's first lines cite: ${headCitations(doc).join(", ") || "-"}`);
  } else if (verdict === "not-in-document") {
    flag(r, "number not in the document", `sheet: ${r.caseNumber}; site had: ${cur.caseNumber}; the document's first lines cite: ${headCitations(doc).join(", ") || "-"}`);
  }
  const set = {};
  if (!keep) Object.assign(set, { caseNumber: r.caseNumber, court: r.court, year });
  if (r.subject) set.subject = r.subject;
  if (r.outcome) set.outcome = r.outcome;
  if (found.decisionDate && r.decisionDate) set.decisionDate = r.decisionDate;
  if (found.language && r.language) set.language = r.language;
  if (r.title) set.title = r.title;
  if (r.keyPhrase) set.keyPhrase = r.keyPhrase;
  if (r.description) set.metaDescription = r.description;
  const changes = Object.entries(set).filter(([k, v]) => cur[k] !== v);
  if (!changes.length) {
    result.unchanged.push({ line: r.line, title: r.title });
    continue;
  }
  result.updated.push({ line: r.line, title: r.title, changed: changes.map(([k, v]) => ({ field: k, from: cur[k] ?? null, to: v })), numberKept: keep });
  if (write) fs.writeFileSync(file, JSON.stringify({ ...cur, ...set }, null, 2) + "\n");
}

// the cases that are new go through the importer's pipeline (text from the document, pending list rebuilt)
if (toCreate.length) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "case-sheet-"));
  fs.writeFileSync(path.join(tmp, "rows.json"), JSON.stringify(toCreate.map((c) => Object.fromEntries(Object.entries(c).filter(([k]) => k !== "_line")))));
  const cmd = ["scripts/import-batch.mjs", "--rows", path.join(tmp, "rows.json"), "--docs", docsDir, "--report", path.join(tmp, "report.json"), ...(write ? ["--write"] : [])];
  const out = execFileSync(process.execPath, cmd, { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const rep = JSON.parse(fs.readFileSync(path.join(tmp, "report.json"), "utf8"));
  const lineOf = new Map(toCreate.map((c) => [c.address, c._line]));
  for (const i of rep.imported) result.created.push({ line: lineOf.get(i.address), title: i.title, address: i.address, words: i.words });
  for (const p of rep.problems) {
    result.problems.push({ line: lineOf.get(p.address), address: p.address, problem: p.problem });
    result.held.push({ line: lineOf.get(p.address), title: p.title, reason: p.problem });
  }
  result.importer = out.trim().split("\n").slice(-2);
}

const n = (a) => a.length;
console.log(`${write ? "Done" : "Would do"}: created ${n(result.created)}, updated ${n(result.updated)} (${result.updated.filter((u) => u.numberKept).length} with the case number kept), unchanged ${n(result.unchanged)}, held ${n(result.held)}, flagged ${n(result.flagged)}.`);
for (const h of result.held) console.log(`  held  row ${h.line}: ${h.title} -- ${h.reason}`);
if (opt("--report")) fs.writeFileSync(opt("--report"), JSON.stringify(result, null, 1));
if (!write) console.log("Nothing saved (add --write to save).");
