// Stage 2 importer, first part: read the site owner's delivery sheet and CHECK it. Nothing is written yet.
//
//   node scripts/import-delivery.mjs --csv delivery.csv            checks the sheet's rows
//   node scripts/import-delivery.mjs --csv delivery.csv --fetch    also downloads every Google Doc, converts it and checks
//                                                                  its markup and every internal link
// The sheet (export it as CSV) has the columns: page address, Google Doc link, page title, description; cases also
// case number, court, decision date. Header names are matched loosely (case, spaces and punctuation ignored).
// Exit code 1 when anything blocks. Writing the pages comes with the page content model (Stage 2).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseAddress, loadSiteMap } from "./lib/page-address.mjs";
import { htmlToBlocks, loadDoc, unescapeDoc } from "./import-html-case.mjs";
import { linksIn, inlineProblems } from "../src/lib/inline-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** Minimal CSV reader (quotes, doubled quotes, commas and line breaks inside quotes). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let q = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") (row.push(cell), (cell = ""));
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

const COLUMN = {
  address: ["pageaddress", "address", "path", "url"],
  doc: ["googledoclink", "doclink", "googledoc", "link", "document"],
  title: ["pagetitle", "title"],
  description: ["description", "shortdescription", "metadescription"],
  caseNumber: ["casenumber", "caseno", "casenr"],
  court: ["court"],
  decisionDate: ["decisiondate", "date"],
};

export function readDelivery(csvText) {
  const [head, ...body] = parseCsv(csvText);
  const norm = (h) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
  const idx = {};
  for (const [key, names] of Object.entries(COLUMN)) idx[key] = head.findIndex((h) => names.includes(norm(h)));
  const missing = ["address", "doc", "title", "description"].filter((k) => idx[k] < 0);
  const rows = body.map((r, i) => {
    const get = (k) => (idx[k] >= 0 ? (r[idx[k]] ?? "").trim() : "");
    return { line: i + 2, address: get("address"), doc: get("doc"), title: get("title"), description: get("description"), caseNumber: get("caseNumber"), court: get("court"), decisionDate: get("decisionDate") };
  });
  return { rows, missingColumns: missing, hasCaseColumns: ["caseNumber", "court", "decisionDate"].every((k) => idx[k] >= 0) };
}

const DOC_URL = /^https:\/\/docs\.google\.com\/document\/d\/[A-Za-z0-9_-]{20,}/;

/** Row checks that need no network. Returns [{ line, address, problems: [] }, ...] and the kind of each address. */
export function validateRows(rows, siteMap, hasCaseColumns = true) {
  const out = [];
  const seenAddr = new Map();
  const seenDoc = new Map();
  for (const r of rows) {
    const problems = [];
    const a = parseAddress(r.address, siteMap);
    for (const p of a.problems) problems.push(`address: ${p}`);
    if (a.ok && seenAddr.has(r.address)) problems.push(`address: the same address is on line ${seenAddr.get(r.address)}`);
    seenAddr.set(r.address, seenAddr.get(r.address) ?? r.line);
    if (!r.doc) problems.push("Google Doc link is empty");
    else if (!DOC_URL.test(r.doc)) problems.push("Google Doc link is not a docs.google.com/document link");
    else {
      const id = r.doc.match(/\/d\/([A-Za-z0-9_-]+)/)[1];
      if (seenDoc.has(id)) problems.push(`Google Doc link: the same document is on line ${seenDoc.get(id)}`);
      seenDoc.set(id, seenDoc.get(id) ?? r.line);
    }
    if (!r.title) problems.push("page title is empty");
    if (!r.description) problems.push("description is empty");
    else if (r.description.length > 320) problems.push(`description is ${r.description.length} characters (1 or 2 sentences, at most 320)`);
    if (a.ok && a.kind === "case") {
      if (!hasCaseColumns) problems.push("a case needs the columns case number, court and decision date");
      else {
        if (!r.caseNumber) problems.push("case number is empty");
        if (!r.court) problems.push("court is empty");
        if (!r.decisionDate) problems.push("decision date is empty");
        else if (!/^\d{4}-\d{2}-\d{2}$/.test(r.decisionDate)) problems.push(`decision date "${r.decisionDate}" must be written YYYY-MM-DD`);
      }
    }
    out.push({ line: r.line, address: r.address, kind: a.kind ?? null, problems });
  }
  return out;
}

/** Addresses of the pages that exist already (cases, the fixed pages, state pages). */
export function livePages() {
  const dir = path.join(ROOT, "content", "cases");
  const set = new Set(["/", "/about", "/contact", "/copyright", "/search", "/us", "/us/federal", "/us/states"]);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const c = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    set.add(c.jurisdictionGroup === "country" ? `/${c.jurisdictionSlug}/${c.slug}` : `/us/${c.slug}`);
  }
  return set;
}

/** Internal links of a converted page, checked against this delivery and the live pages. */
export function checkLinks(blocks, deliveryAddresses, live, siteMap) {
  const problems = [];
  const texts = blocks.flatMap((b) => (b.type === "list" ? b.items : b.type === "table" ? b.rows.flatMap((r) => r.cells) : b.type === "paragraph" ? [b.text] : []));
  for (const t of texts) {
    for (const m of inlineProblems(t)) problems.push(`markup: ${m}`);
    for (const { href } of linksIn(t)) {
      if (!href.startsWith("/")) {
        problems.push(`link ${href} goes to another site: links go only to rdtaxcases pages`);
        continue;
      }
      const target = href.split("#")[0];
      if (href !== target && !/^#?[a-z0-9-]+$/.test(href.split("#")[1] ?? "")) problems.push(`link ${href}: the anchor must be a-z, 0-9 and hyphens`);
      const a = parseAddress(target, siteMap);
      const site = live.has(target) || /^\/us\/states\/[a-z-]+$/.test(target);
      if (!a.ok && !site) problems.push(`link ${href}: ${a.problems.join("; ")}`);
      else if (!deliveryAddresses.has(target) && !live.has(target) && !/^\/us\/states\/[a-z-]+$/.test(target)) problems.push(`link ${href}: not in this delivery and not on the site yet`);
    }
  }
  return problems;
}

async function main() {
  const args = process.argv.slice(2);
  const csvPath = args[args.indexOf("--csv") + 1];
  if (!args.includes("--csv") || !csvPath) {
    console.error("Usage: node scripts/import-delivery.mjs --csv delivery.csv [--fetch]");
    process.exit(1);
  }
  const siteMap = loadSiteMap();
  const { rows, missingColumns, hasCaseColumns } = readDelivery(fs.readFileSync(csvPath, "utf8"));
  let blocking = 0;
  if (missingColumns.length) {
    console.log(`The sheet has no column for: ${missingColumns.join(", ")}.`);
    process.exit(1);
  }
  const checked = validateRows(rows, siteMap, hasCaseColumns);
  const kinds = {};
  for (const c of checked) kinds[c.kind ?? "invalid"] = (kinds[c.kind ?? "invalid"] ?? 0) + 1;
  console.log(`${rows.length} row(s): ${JSON.stringify(kinds)}`);

  if (args.includes("--fetch")) {
    const delivery = new Set(rows.map((r) => r.address));
    const live = livePages();
    const queue = checked.map((c, i) => ({ c, r: rows[i] })).filter((x) => x.c.problems.length === 0);
    await Promise.all(
      Array.from({ length: 4 }, async () => {
        while (queue.length) {
          const { c, r } = queue.shift();
          try {
            const { blocks } = htmlToBlocks(unescapeDoc(await loadDoc(r.doc)));
            if (!blocks.length) c.problems.push("the document has no content blocks: is it HTML?");
            c.problems.push(...checkLinks(blocks, delivery, live, siteMap));
            c.blocks = blocks.length;
          } catch (e) {
            c.problems.push(`document: ${e.message}`);
          }
        }
      }),
    );
  }

  for (const c of checked) {
    for (const p of c.problems) {
      blocking++;
      console.log(`line ${c.line} ${c.address || "(no address)"}: ${p}`);
    }
  }
  console.log(`\n${blocking} problem(s).`);
  process.exit(blocking ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
