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

/** One spelling of the court names: a dash with spaces around it ("Federal Court - Trial Division", "Federal Court — Trial Division") is " – ". */
export const normaliseCourt = (court) => String(court ?? "").replace(/\s+/g, " ").replace(/\s[-–—]\s/g, " – ").trim();

const LANGUAGE_NAMES = { english: "en", french: "fr", francais: "fr", "français": "fr", anglais: "en", italian: "it", german: "de", spanish: "es", portuguese: "pt" };
/**
 * The language of a row as a code: "French" -> "fr-CA" for a Canadian row (the region of the country's own language code, `countryLang`),
 * "fr" -> "fr", "fr-CA" -> "fr-CA". Returns "" when it is neither a known language name nor a code.
 */
export function languageCode(value, countryLang) {
  const v = String(value ?? "").trim();
  if (!v) return "";
  const base = LANGUAGE_NAMES[v.toLowerCase()];
  if (base) {
    const region = String(countryLang ?? "").split("-")[1];
    return region ? `${base}-${region}` : base;
  }
  return /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(v) ? v : "";
}

const FRENCH_WORDS = /\b(le|la|les|des|du|une|est|dans|pour|que|qui|aux|sur|par|ses|cette|ont|été|dont|avec|sont|l'|d')\b/gi;
const ENGLISH_WORDS = /\b(the|and|of|is|in|to|that|for|was|with|by|are|this|which|from|has|not)\b/gi;
/** The language of a document's text, "fr" or "en", from the first 6000 characters (a count of common words of each language). */
export function detectLanguage(docText) {
  const t = plainDoc(docText).slice(0, 6000);
  return (t.match(FRENCH_WORDS) ?? []).length > (t.match(ENGLISH_WORDS) ?? []).length ? "fr" : "en";
}

/**
 * The kind of a case number: a neutral citation (2023 TCC 18), a C.T.C. reporter citation ([1998] 3 C.T.C. 2520), a DTC citation (88 DTC 1363),
 * a CanLII citation (1998 CanLII 553 (TCC)) or a docket number. Two numbers of different kinds can name the same decision, so only
 * a different number of the same kind is a contradiction.
 */
export function citationSeries(number) {
  const n = String(number).trim();
  if (/CanLII/i.test(n)) return "canlii";
  if (/C\.T\.C\./.test(n)) return "ctc";
  if (/\bDTC\b/.test(n)) return "dtc";
  if (/^\d{4} [A-Z]{2,5} \d+$/.test(n)) return "neutral";
  return "docket";
}

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
      court: normaliseCourt(get("court")),
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
    if (idx.language >= 0 && row.language && !languageCode(row.language, "")) row.problems.push(`the language "${row.language}" is not a language name or code (for example French or fr)`);
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
  // a contradiction needs the same kind of number: the site's is in the document, the sheet's is another number of the same kind
  if (current && citationSeries(current) === citationSeries(number) && text.includes(squash(current))) return "contradicts-site";
  return "not-in-document";
}

/** The case citations in the first 2500 characters of a document (to show what it says when it does not agree). */
export function headCitations(docText) {
  const CIT = /\b\d{4} (?:TCC|FCA|FC|SCC|ONCA|BCCA|ONSC|BCSC|QCCA|QCCS|QCCQ|ABCA|ABQB|ABPC|NSCA|FCTD) \d+\b|\[\d{4}\] \d+ (?:C\.T\.C\.|F\.C\.|S\.C\.R\.|D\.T\.C\.) \d+|\b\d{2,4} DTC \d+/g;
  return [...new Set(plainDoc(docText).slice(0, 2500).match(CIT) ?? [])];
}
