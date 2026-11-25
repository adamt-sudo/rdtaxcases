// The case sheet layout (one sheet per country; first used for Canada). Columns are found by their header, in any order:
//
//   URL               the page address, e.g. /ca/northwest-hydraulic-consultants-v-the-queen-1998-tcc      (required)
//   URL_LINK... / HTML doc / Google Doc link   the Google Doc with the case's HTML                         (required)
//   Page Title        the page title                                                                       (required)
//   Key Phrase        the phrase the page is about                                                         (optional)
//   Meta Description  at most 155 characters                                                               (optional)
//   Case Summary      one line: the case's subject, shown on the page and in the lists                     (optional)
//   Outcome           the outcome                                                                          (optional)
//   Case Number       the case number                                                                      (required)
//   Court             the deciding court (the header may read "Tax Court": any header with "court")        (required)
//   Year              four digits                                                                          (required)
//   Decision date     yyyy-mm-dd                                                                           (optional, only if the column exists)
//   Language          the code of the page's language, e.g. fr                                             (optional, only if the column exists)
//
// "Full URL" and "URL Live" (and any other column) are ignored. The country is the first part of the address.
import { parseCsv } from "../import-delivery.mjs";
import { parseAddress } from "./page-address.mjs";

const norm = (h) => String(h ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const COLUMNS = {
  address: (n) => n === "url" || n === "pageaddress" || n === "address",
  doc: (n) => n.startsWith("urllink") || n.includes("htmldoc") || n === "googledoclink" || n === "doclink" || n === "document",
  title: (n) => n === "pagetitle" || n === "title",
  keyPhrase: (n) => n === "keyphrase",
  description: (n) => n === "metadescription" || n === "description",
  subject: (n) => n === "casesummary" || n === "subject",
  outcome: (n) => n === "outcome",
  caseNumber: (n) => n === "casenumber",
  court: (n) => n.includes("court"),
  year: (n) => n === "year",
  decisionDate: (n) => n === "decisiondate",
  language: (n) => n === "language",
};
const REQUIRED = ["address", "doc", "title", "caseNumber", "court", "year"];

/** The document id of a Google Doc link. */
export const docIdOf = (url) => (String(url).match(/\/document\/d\/([A-Za-z0-9_-]{20,})/) || [])[1] ?? null;

/**
 * Read the sheet. Returns { rows, missingColumns, found } where each row is
 * { line, address, cc, slug, docUrl, docId, title, keyPhrase, description, subject, outcome, caseNumber, court, year, decisionDate, language, problems }.
 */
export function readCaseSheet(csvText, siteMap) {
  const [head, ...body] = parseCsv(csvText);
  const idx = {};
  for (const [key, test] of Object.entries(COLUMNS)) idx[key] = head.findIndex((h) => test(norm(h)));
  const missingColumns = REQUIRED.filter((k) => idx[k] < 0);
  const seen = new Map();
  const rows = body.map((r, i) => {
    const get = (k) => (idx[k] >= 0 ? String(r[idx[k]] ?? "").trim() : "");
    const row = {
      line: i + 2,
      address: get("address"),
      docUrl: get("doc"),
      title: get("title"),
      keyPhrase: get("keyPhrase"),
      description: get("description"),
      subject: get("subject"),
      outcome: get("outcome"),
      caseNumber: get("caseNumber"),
      court: get("court"),
      year: get("year"),
      decisionDate: get("decisionDate"),
      language: get("language"),
      problems: [],
    };
    row.docId = docIdOf(row.docUrl);
    const a = parseAddress(row.address, siteMap);
    for (const p of a.problems) row.problems.push(`address: ${p}`);
    if (a.ok && a.kind !== "case") row.problems.push(`address: ${row.address} is a ${a.kind}, not a case`);
    row.cc = a.ok ? a.cc : null;
    row.slug = a.ok ? a.slug : null;
    if (a.ok && seen.has(row.address)) row.problems.push(`address: the same address is on line ${seen.get(row.address)}`);
    seen.set(row.address, seen.get(row.address) ?? row.line);
    if (!row.docId) row.problems.push("the Google Doc link is empty or not a docs.google.com/document link");
    if (!row.title) row.problems.push("the page title is empty");
    if (!row.caseNumber) row.problems.push("the case number is empty");
    if (!row.court) row.problems.push("the court is empty");
    if (!/^(1[6-9]|20)\d{2}$/.test(row.year)) row.problems.push(`the year "${row.year}" is not four digits`);
    if (row.description.length > 155) row.problems.push(`the meta description is ${row.description.length} characters (at most 155)`);
    if (idx.decisionDate >= 0 && row.decisionDate && (!/^\d{4}-\d{2}-\d{2}$/.test(row.decisionDate) || Number.isNaN(Date.parse(row.decisionDate)))) {
      row.problems.push(`the decision date "${row.decisionDate}" is not yyyy-mm-dd`);
    }
    if (idx.language >= 0 && row.language && !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(row.language)) row.problems.push(`the language "${row.language}" is not a language code (for example fr)`);
    return row;
  });
  return { rows, missingColumns, found: Object.fromEntries(Object.entries(idx).map(([k, v]) => [k, v >= 0])) };
}

const plainDoc = (s) =>
  String(s)
    .replace(/\\([<>[\]()_*#`~|\\!+.=&"'{}-])/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const squash = (s) => s.toLowerCase().replace(/[()\s ]+/g, "");

/**
 * Does the document agree with a case number? `current` is the number the site has now (from the document itself), if any.
 *   "agrees"             the sheet's number is in the document
 *   "contradicts-site"   the document has the site's current number and not the sheet's: the sheet's is probably another decision's
 *   "not-in-document"    the sheet's number is not in the document (nothing to compare it with, or the document gives another number)
 */
export function checkNumber(docText, number, current = null) {
  const text = squash(plainDoc(docText));
  if (text.includes(squash(number))) return "agrees";
  if (current && text.includes(squash(current))) return "contradicts-site";
  return "not-in-document";
}

/** The case citations in the first 2500 characters of a document (to show what it says when it does not agree). */
export function headCitations(docText) {
  const CIT = /\b\d{4} (?:TCC|FCA|FC|SCC|ONCA|BCCA|ONSC|BCSC|QCCA|QCCS|QCCQ|ABCA|ABQB|ABPC|NSCA|FCTD) \d+\b|\[\d{4}\] \d+ (?:C\.T\.C\.|F\.C\.|S\.C\.R\.|D\.T\.C\.) \d+|\b\d{2,4} DTC \d+/g;
  return [...new Set(plainDoc(docText).slice(0, 2500).match(CIT) ?? [])];
}
