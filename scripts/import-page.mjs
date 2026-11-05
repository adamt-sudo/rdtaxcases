// Importer for a glossary term, a law (legislation page) or a FAQ question written as HTML in one Google Doc.
//
//   node scripts/import-page.mjs --address /us/glossary/irc-section-41 --doc <Google Doc id | link | file>
//        [--description "..."] [--status preview|published|draft] [--write]
//
// The address decides the page type (checked with the link spec, scripts/lib/page-address.mjs). The document is
// converted with the same reader as the cases (scripts/import-html-case.mjs):
//   - the wrappers (article, header, section, figure) are dropped; their text and the table captions stay;
//   - the h1 is the page title; h2 / h3 become heading / subheading;
//   - <time datetime> in the dates line become the page's "published" and "updated" dates (the line is shown from them);
//   - <cite> becomes emphasis; every link to this site loses its trailing slash.
// Without --write nothing is saved: the report says what would be written (and which links are new pending pages).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadSiteMap, parseAddress } from "./lib/page-address.mjs";
import { describe, htmlToBlocks, loadDoc, unescapeDoc } from "./import-html-case.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");


/** Convert the text of the document into the page record (no file is written). */
export function buildPage({ address, text, description, status, siteMap = loadSiteMap() }) {
  const a = parseAddress(address, siteMap);
  if (!a.ok) throw new Error(`address ${address}: ${a.problems.join("; ")}`);
  if (!["glossary-term", "legislation-page", "faq-question"].includes(a.kind)) throw new Error(`address ${address} is a ${a.kind}: this importer reads glossary terms, laws and FAQ questions`);
  const { blocks, articleTitle, report } = htmlToBlocks(unescapeDoc(text));
  const dates = [...new Set(report.times)].filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t)).sort();
  // the dates line ("November 3, 2026 (verified and updated November 4, 2026)") is shown from the two dates
  if (dates.length && blocks[0]?.type === "paragraph" && /^[A-Z][a-z]+ \d{1,2}, \d{4}/.test(blocks[0].text)) blocks.shift();
  if (!articleTitle) throw new Error("the document has no single h1 to take as the page title");
  const page = {
    kind: a.kind,
    country: a.cc,
    title: articleTitle,
    ...(description ? { description } : {}),
    ...(dates[0] ? { published: dates[0] } : {}),
    ...(dates[1] ? { updated: dates[dates.length - 1] } : {}),
    language: siteMap.countries[a.cc].htmlLang,
    status: status ?? "preview",
    body: blocks,
  };
  return { page, report, kind: a.kind };
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  const address = opt("--address");
  const doc = opt("--doc");
  if (!address || !doc) {
    console.error('Usage: node scripts/import-page.mjs --address /us/glossary/<term> --doc <Google Doc id | link | file> [--description "..."] [--status preview|published|draft] [--write]');
    process.exit(1);
  }
  const text = await loadDoc(doc);
  const { page, report, kind } = buildPage({ address, text, description: opt("--description"), status: opt("--status") });
  const d = describe(page.body);
  const hrefs = d.links.map((l) => l.href);
  const pendingFile = path.join(ROOT, "content", "pending-pages.json");
  const pending = new Set(JSON.parse(fs.readFileSync(pendingFile, "utf8")).pages.map((p) => p.address));
  const files = fs.readdirSync(path.join(ROOT, "content", "cases")).map((f) => f.replace(/\.json$/, ""));
  const known = (h) => pending.has(h) || /^\/us\/(federal|states(\/[a-z-]+)?)?$/.test(h) || files.some((s) => h === `/us/${s}`);
  console.log(`Page: ${address} (${kind}), title "${page.title}"`);
  console.log(`Dates: published ${page.published ?? "-"}, updated ${page.updated ?? "-"}`);
  console.log(`Blocks: ${JSON.stringify(d.types)}, ${d.words} words`);
  console.log(`Links: ${hrefs.length}, ${new Set(hrefs).size} distinct; ${new Set(hrefs.filter((h) => !known(h))).size} distinct address(es) not in the pending list yet`);
  console.log(`Tags dropped (text kept): ${JSON.stringify(report.droppedTags)}; links dropped: ${report.droppedLinks.length}`);
  if (!page.description) console.log("Description: none yet (the delivery sheet gives it)");
  const file = path.join(ROOT, "content", "pages", `${address.slice(1)}.json`);
  if (args.includes("--write")) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(page, null, 2) + "\n");
    console.log(`Written to ${path.relative(ROOT, file)}`);
  } else console.log("Nothing saved (add --write to save).");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
