// Import a delivery of documents in one run: legislation pages, FAQ questions, glossary terms and cases.
//
//   node scripts/import-batch.mjs --rows rows.json --docs <folder of <doc id>.txt> [--skip skip.json] [--descriptions d.json] [--report report.json] [--write]
//
// rows.json: a list of { type: "legislation" | "faq" | "glossary" | "case", title, address, id, oldSlug? } (id = the Google
// Doc id; the text export of each document is read from <folder>/<id>.txt, or fetched when it is not there). The sheet itself is
// never read here: the HTML always comes from the documents. skip.json: { "<id>": "reason" } for rows that must not be imported
// (a mismatch, a document that does not open).
//
// For every row:
//   - the document is cleaned (scripts/lib/doc-clean.mjs): h1 removed, works-cited section removed, footnote markers removed,
//     MathML turned into text; links to this site become paths without a trailing slash (and are written as full addresses by
//     the renderer), the target/rel attributes are dropped (the renderer opens other sites' links in a new tab with rel=noopener);
//   - the answer capsule is the summary; the meta description is made from it (at most 155 characters): the first sentence when it
//     fits, else the text of --descriptions (written from the capsule by hand), else a cut at a strong break or a word;
//   - a page (legislation / FAQ / glossary) is written to content/pages/<address>.json, published;
//   - a case replaces the text of the case with the same name (oldSlug): the metadata of the case stays, the summary is the
//     capsule, the body is the document; when the address changes the file is renamed and the old slug is recorded in
//     content/slug-history.json (the 301 redirects are generated from it).
// Afterwards the pending list is rebuilt (pages that are linked and do not exist). Without --write nothing is saved.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, loadDoc } from "./import-html-case.mjs";
import { convertDoc } from "./lib/html-body.mjs";
import { makeDescription } from "./lib/describe.mjs";
import { loadSiteMap, parseAddress } from "./lib/page-address.mjs";
import { refreshPending } from "./lib/pending.mjs";
import { dedupeExternalLinks, rewriteLegacyLinks } from "./lib/legacy-links.mjs";
import { plainText } from "../src/lib/inline-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const KIND = { glossary: "glossary-term", legislation: "legislation-page", faq: "faq-question" };

export const cleanTitle = (type, t) => {
  let s = t.replace(/\s+/g, " ").trim();
  if (type === "faq") s = s.replace(/(?<!\.)\.$/, ""); // a FAQ question has no full stop at the end
  return s;
};

// Convert one document: { blocks, capsule, report }. It lives in lib/html-body.mjs, shared with the editor's HTML body field.
export { convertDoc };

async function main() {
  const args = process.argv.slice(2);
  const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  const rows = JSON.parse(fs.readFileSync(opt("--rows"), "utf8"));
  const docsDir = opt("--docs");
  const skip = opt("--skip") ? JSON.parse(fs.readFileSync(opt("--skip"), "utf8")) : {};
  const written = opt("--descriptions") ? JSON.parse(fs.readFileSync(opt("--descriptions"), "utf8")) : {};
  const write = args.includes("--write");
  const siteMap = loadSiteMap();
  const result = { imported: [], skipped: [], problems: [], methods: {} };
  // content/case-overrides.json: corrected fields that a re-import must not undo (the sheet still carries the old value)
  const overridesFile = path.join(ROOT, "content", "case-overrides.json");
  const overrides = fs.existsSync(overridesFile) ? JSON.parse(fs.readFileSync(overridesFile, "utf8")).cases ?? {} : {};
  const applyOverrides = (record) => {
    for (const [field, value] of Object.entries(overrides[record.slug] ?? {})) if (field !== "reason") record[field] = value;
    return record;
  };
  const histFile = path.join(ROOT, "content", "slug-history.json");
  const history = fs.existsSync(histFile) ? JSON.parse(fs.readFileSync(histFile, "utf8")) : { note: "", renames: {} };
  const orderFile = path.join(ROOT, "content", "case-order.json");
  let order = fs.existsSync(orderFile) ? JSON.parse(fs.readFileSync(orderFile, "utf8")) : [];

  for (const r of rows) {
    if (skip[r.id] || skip[r.address]) {
      result.skipped.push({ type: r.type, title: r.title, address: r.address, why: skip[r.id] || skip[r.address] });
      continue;
    }
    const a = parseAddress(r.address, siteMap);
    const problem = (m) => result.problems.push({ type: r.type, title: r.title, address: r.address, problem: m });
    if (!a.ok) {
      problem("address: " + a.problems.join("; "));
      continue;
    }
    if (r.type !== "case" && a.kind !== KIND[r.type]) {
      problem(`the address is a ${a.kind}, the sheet is ${r.type}`);
      continue;
    }
    if (r.type === "case" && a.kind !== "case") {
      problem(`the address is a ${a.kind}, not a case`);
      continue;
    }
    let text;
    try {
      const f = docsDir && path.join(docsDir, `${r.id}.txt`);
      text = f && fs.existsSync(f) ? fs.readFileSync(f, "utf8") : await loadDoc(r.id);
    } catch (e) {
      problem("document: " + e.message);
      continue;
    }
    const { blocks, capsule, report } = convertDoc(text);
    // each outside address is linked once per page (the first); a repeat is plain text
    const repeatsUnlinked = dedupeExternalLinks(blocks);
    if (!blocks.length) {
      problem("the document has no content blocks");
      continue;
    }
    let desc = makeDescription(capsule, 155, r.title);
    if (written[r.address]) desc = { text: written[r.address].trim(), method: "written" };
    // the owner's own meta description (the sheet's column) is used as given
    if (r.sheetDescription) desc = { text: r.sheetDescription.trim(), method: "sheet" };
    if (desc.text.length > 155) problem(`the description is ${desc.text.length} characters (at most 155)`);
    result.methods[desc.method] = (result.methods[desc.method] ?? 0) + 1;
    const d = describe(blocks);
    const rec = { type: r.type, title: r.title, address: r.address, words: d.words, blocks: blocks.length, links: d.links.length, internal: d.links.filter((l) => l.href.startsWith("/")).length, external: d.links.filter((l) => !l.href.startsWith("/")).length, description: desc.text, descriptionMethod: desc.method, removedReferences: report.removedReferences, removedFootnoteMarkers: report.removedFootnoteMarkers, removedH1: report.removedH1, mathReplaced: report.mathReplaced, droppedLinks: report.droppedLinks, repeatedOutsideLinksUnlinked: repeatsUnlinked };
    if (!capsule) problem("no answer capsule: the description and summary are empty");
    result.imported.push(rec);
    if (!write) continue;

    if (r.type === "case" && r.create) {
      // a case with no existing record: created from the row's fields (court and date from the sheet's name, number from the document)
      const body = blocks[0]?.type === "paragraph" && plainText(blocks[0].text).replace(/\s+/g, " ").trim() === capsule ? blocks.slice(1) : blocks;
      const group = r.create.jurisdictionGroup ?? "usa-federal";
      const where = r.create.jurisdictionSlug ?? "federal";
      const file = path.join(ROOT, "content", "cases", `${a.slug}.json`);
      // the file name is the slug: a slug that is already the file of a case of another jurisdiction must not overwrite it
      if (fs.existsSync(file)) {
        const there = JSON.parse(fs.readFileSync(file, "utf8"));
        if (there.jurisdictionSlug !== where) {
          problem(`the slug is already the case file of another jurisdiction (${there.jurisdictionSlug}/${there.slug})`);
          result.imported.pop();
          continue;
        }
      }
      const rec2 = { slug: a.slug, title: r.create.title, caseNumber: r.create.caseNumber, court: r.create.court, year: r.create.year, decisionDate: r.create.decisionDate, subject: r.create.subject, ...(r.create.outcome ? { outcome: r.create.outcome } : {}), ...(r.create.language ? { language: r.create.language } : {}), jurisdictionGroup: group, jurisdictionSlug: where, ...(r.create.country ? { country: r.create.country } : {}), ...(r.keyPhrase ? { keyPhrase: r.keyPhrase } : {}), summary: capsule, metaDescription: desc.text, body };
      fs.writeFileSync(file, JSON.stringify(applyOverrides(rec2), null, 2) + "\n");
      rec.created = true;
    } else if (r.type === "case") {
      // when the case was already renamed by an earlier run, its file has the new slug
      const curSlug = fs.existsSync(path.join(ROOT, "content", "cases", `${r.oldSlug}.json`)) ? r.oldSlug : (history.renames[r.oldSlug] ?? r.oldSlug);
      const oldFile = path.join(ROOT, "content", "cases", `${curSlug}.json`);
      const c = JSON.parse(fs.readFileSync(oldFile, "utf8"));
      const newSlug = a.slug;
      if (newSlug !== curSlug && fs.existsSync(path.join(ROOT, "content", "cases", `${newSlug}.json`))) {
        problem(`the new address /us/${newSlug} is already another case`);
        result.imported.pop();
        continue;
      }
      // the capsule is the summary: it is not repeated as the first paragraph of the text
      const body = blocks[0]?.type === "paragraph" && plainText(blocks[0].text).replace(/\s+/g, " ").trim() === capsule ? blocks.slice(1) : blocks;
      const next = { ...c, slug: newSlug, summary: capsule || c.summary, metaDescription: desc.text, body };
      delete next.articleTitle; // the old headline belonged to the old document: the new content replaces it
      const newFile = path.join(ROOT, "content", "cases", `${newSlug}.json`);
      if (newSlug !== curSlug) {
        fs.rmSync(oldFile);
        history.renames[r.oldSlug] = newSlug;
        order = order.map((s) => (s === curSlug ? newSlug : s));
      }
      fs.writeFileSync(newFile, JSON.stringify(applyOverrides(next), null, 2) + "\n");
      rec.oldSlug = r.oldSlug;
      rec.slugChanged = newSlug !== r.oldSlug;
    } else {
      const page = { kind: a.kind, country: a.cc, title: r.sheetTitle ? r.title.trim() : cleanTitle(r.type, r.titleOverride ?? r.title), ...(r.keyPhrase ? { keyPhrase: r.keyPhrase } : {}), ...(desc.text ? { description: desc.text } : {}), ...(capsule ? { summary: capsule } : {}), language: siteMap.countries[a.cc].htmlLang, status: "published", body: blocks };
      const file = path.join(ROOT, "content", "pages", `${r.address.slice(1)}.json`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(page, null, 2) + "\n");
    }
  }
  if (write) {
    // renames may chain (a -> b -> c): keep every old slug pointing to the last one
    for (const [o, n] of Object.entries(history.renames)) {
      let last = n;
      const seen = new Set([o]);
      while (history.renames[last] && !seen.has(last)) {
        seen.add(last);
        last = history.renames[last];
      }
      history.renames[o] = last;
    }
    history.renames = Object.fromEntries(Object.entries(history.renames).sort());
    history.note ||= "Case slugs that changed: old slug -> current slug. scripts/build-redirects.mjs makes the 301 redirects from it (the old /cases/<slug> and /us/<slug> both go to /us/<current slug>).";
    fs.writeFileSync(histFile, JSON.stringify(history, null, 2) + "\n");
    fs.writeFileSync(orderFile, JSON.stringify(order, null, 2) + "\n");
    result.legacyLinks = rewriteLegacyLinks({ write: true });
    result.pending = refreshPending({ write: true });
    result.pending = { total: result.pending.pending.length, added: result.pending.added.length, removed: result.pending.removed.length, legacyLinksRewritten: result.legacyLinks.length };
  }
  if (opt("--report")) fs.writeFileSync(opt("--report"), JSON.stringify(result, null, 1));
  const by = {};
  for (const x of result.imported) by[x.type] = (by[x.type] ?? 0) + 1;
  console.log(`${write ? "Imported" : "Would import"}: ${JSON.stringify(by)}; skipped ${result.skipped.length}; problems ${result.problems.length}; descriptions: ${JSON.stringify(result.methods)}`);
  for (const p of result.problems) console.log(`  PROBLEM ${p.type} ${p.address}: ${p.problem}`);
  if (write) console.log(`Pending list: ${JSON.stringify(result.pending)}`);
  else console.log("Nothing saved (add --write to save).");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
