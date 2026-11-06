// Link density of every page that has links: links per 1,000 words, distinct targets and repeats per target.
//
//   node scripts/link-density.mjs               a table on screen (cases and pages with at least one link)
//   node scripts/link-density.mjs --csv out.csv also writes the table as CSV
//   node scripts/link-density.mjs --detail /us/glossary/irc-section-41    every target of one page, with its count
//
// Words are the visible words of the text (headings, paragraphs, list items, table cells and captions; the tags are
// not counted). A link counts once per place it appears; a repeat is a second or later link to the same target.
// "per 1,000 words if only the first mention is linked" is the density the page would have without repeats.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { linksIn, plainText } from "../src/lib/inline-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const args = process.argv.slice(2);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);

const walk = (d, acc = []) => {
  if (!fs.existsSync(d)) return acc;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".json")) acc.push(p);
  }
  return acc.sort();
};

function textsOf(body) {
  const t = [];
  for (const b of body ?? []) {
    if (b.type === "heading" || b.type === "subheading" || b.type === "paragraph") t.push(b.text);
    else if (b.type === "list") t.push(...b.items);
    else if (b.type === "table") t.push(...(b.caption ? [b.caption] : []), ...b.headers, ...b.rows.flatMap((r) => (Array.isArray(r) ? r : r.cells)));
  }
  return t;
}

export function measure(address, body) {
  const texts = textsOf(body);
  const words = texts.reduce((n, t) => n + plainText(t).split(/\s+/).filter(Boolean).length, 0);
  const counts = new Map();
  for (const t of texts) for (const l of linksIn(t)) counts.set(l.href, (counts.get(l.href) ?? 0) + 1);
  const links = [...counts.values()].reduce((a, b) => a + b, 0);
  const distinct = counts.size;
  const perK = (n) => (words ? Math.round((n / words) * 10000) / 10 : 0);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return {
    address, words, links, distinct, repeats: links - distinct,
    perThousand: perK(links), perThousandFirstOnly: perK(distinct),
    maxRepeat: sorted[0]?.[1] ?? 0, mostRepeated: sorted[0]?.[0] ?? "",
    repeatedTargets: sorted.filter(([, n]) => n > 1).length,
    counts: sorted,
  };
}

function main() {
  const rows = [];
  for (const f of walk(path.join(ROOT, "content", "cases"))) {
    const c = JSON.parse(fs.readFileSync(f, "utf8"));
    const addr = c.jurisdictionGroup === "country" ? `/${c.jurisdictionSlug}/${c.slug}` : `/us/${c.slug}`;
    rows.push(measure(addr, c.body));
  }
  for (const f of walk(path.join(ROOT, "content", "pages"))) {
    const p = JSON.parse(fs.readFileSync(f, "utf8"));
    rows.push(measure("/" + path.relative(path.join(ROOT, "content", "pages"), f).split(path.sep).join("/").replace(/\.json$/, ""), p.body));
  }

  if (opt("--detail")) {
    const r = rows.find((x) => x.address === opt("--detail"));
    if (!r) {
      console.error("no such page");
      process.exit(1);
    }
    console.log(`${r.address}: ${r.words} words, ${r.links} links, ${r.distinct} distinct targets`);
    for (const [h, n] of r.counts) console.log(`${String(n).padStart(3)}  ${h}`);
    process.exit(0);
  }

  const withLinks = rows.filter((r) => r.links > 0).sort((a, b) => b.perThousand - a.perThousand);
  console.log(`${rows.length} page(s) measured, ${withLinks.length} with links.\n`);
  console.log("links/1000w  links  distinct  repeats  max-repeat  words  address");
  for (const r of withLinks) console.log(`${String(r.perThousand).padStart(11)}  ${String(r.links).padStart(5)}  ${String(r.distinct).padStart(8)}  ${String(r.repeats).padStart(7)}  ${String(r.maxRepeat).padStart(10)}  ${String(r.words).padStart(5)}  ${r.address}`);
  if (opt("--csv")) {
    const head = "address,words,links,links_per_1000_words,distinct_targets,repeat_links,targets_linked_more_than_once,max_repeats_of_one_target,most_repeated_target,links_per_1000_words_if_only_first_mention_linked";
    const lines = withLinks.map((r) => [r.address, r.words, r.links, r.perThousand, r.distinct, r.repeats, r.repeatedTargets, r.maxRepeat, r.mostRepeated, r.perThousandFirstOnly].join(","));
    fs.writeFileSync(opt("--csv"), [head, ...lines].join("\r\n") + "\r\n");
    console.log(`\nWritten to ${opt("--csv")}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
