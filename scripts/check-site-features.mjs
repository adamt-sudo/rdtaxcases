// After `next build`: the features every page of the built site must have.
//   node scripts/check-site-features.mjs [out-dir]
//   - the Zendesk widget script is in the <head> of every page, once, with the key of src/lib/site-config.ts
//   - the three list pages (/us/glossary, /us/faq, /us/legislation) exist, are indexable, have their own canonical, are in the
//     sitemap, and link to every page of their type; the footer of every page links to them
//   - every glossary, FAQ, legislation and case page starts with the Back button (a plain link to its list page)
//   - every link inside the content of those pages opens in a new tab (target="_blank" rel="noopener", never noreferrer);
//     the header, footer and breadcrumb links stay in the same tab
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve(process.argv[2] ?? "out");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://rdtaxcases.com";
const problems = [];
const bad = (m) => problems.push(m);
const count = { pages: 0, contentPages: 0, contentLinks: 0 };

const config = fs.readFileSync(path.join(ROOT, "src", "lib", "site-config.ts"), "utf8");
const KEY = (config.match(/ZENDESK_KEY\s*=\s*"([^"]+)"/) || [])[1];
if (!KEY) bad("src/lib/site-config.ts has no ZENDESK_KEY");
const SNIPPET = `https://static.zdassets.com/ekr/snippet.js?key=${KEY}`;

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name !== "admin" && e.name !== "_next") walk(p, acc);
    } else if (e.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}
const rel = (f) => path.relative(OUT, f).split(path.sep).join("/");
const read = (p) => fs.readFileSync(path.join(OUT, p), "utf8");

// content addresses
const contentPages = [];
const walkJson = (d, acc = []) => {
  if (!fs.existsSync(d)) return acc;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walkJson(p, acc);
    else if (e.name.endsWith(".json")) acc.push(p);
  }
  return acc;
};
const pagesDir = path.join(ROOT, "content", "pages");
const byKind = { glossary: [], faq: [], legislation: [] };
for (const f of walkJson(pagesDir)) {
  const p = JSON.parse(fs.readFileSync(f, "utf8"));
  if ((p.status ?? "published") === "draft") continue;
  const a = "/" + path.relative(pagesDir, f).split(path.sep).join("/").replace(/\.json$/, "");
  contentPages.push({ address: a, hub: `/us/${p.kind === "glossary-term" ? "glossary" : p.kind === "faq-question" ? "faq" : "legislation"}` });
  if (p.status === "preview") continue;
  byKind[p.kind === "glossary-term" ? "glossary" : p.kind === "faq-question" ? "faq" : "legislation"].push(a);
}
for (const f of fs.readdirSync(path.join(ROOT, "content", "cases")).filter((x) => x.endsWith(".json"))) {
  const c = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "cases", f), "utf8"));
  if ((c.status ?? "published") !== "published") continue;
  const a = c.jurisdictionGroup === "country" ? `/${c.jurisdictionSlug}/${c.slug}` : `/us/${c.slug}`;
  const hub = c.jurisdictionGroup === "usa-federal" ? "/us/federal" : c.jurisdictionGroup === "usa-states" ? `/us/states/${c.jurisdictionSlug}` : `/${c.jurisdictionSlug}`;
  contentPages.push({ address: a, hub });
}
const contentByAddress = new Map(contentPages.map((p) => [p.address, p]));

const sitemap = read("sitemap.xml");

for (const f of walk(OUT)) {
  const name = rel(f);
  const html = fs.readFileSync(f, "utf8");
  count.pages++;
  const isNotFound = name === "404.html" || name === "_not-found.html";

  // Zendesk
  const head = (html.match(/<head>[\s\S]*?<\/head>/) || [""])[0];
  const tags = head.match(/<script[^>]*id="ze-snippet"[^>]*>/g) || [];
  if (tags.length !== 1) bad(`${name}: ${tags.length} Zendesk snippet(s) in the head (needs exactly 1)`);
  else if (!tags[0].includes(`src="${SNIPPET}"`)) bad(`${name}: the Zendesk snippet has the wrong src`);

  // footer links to the list pages
  if (!isNotFound) {
    const footer = (html.match(/<footer[\s\S]*?<\/footer>/) || [""])[0];
    for (const h of ["/us/glossary", "/us/faq", "/us/legislation"]) if (!footer.includes(`href="${SITE}${h}"`)) bad(`${name}: the footer has no link to ${h}`);
    if (/<a\b[^>]*target="_blank"/.test(footer.replace(/<a\b[^>]*href="https:\/\/(?!rdtaxcases\.com)[^"]*"[^>]*>/g, ""))) bad(`${name}: a footer link to this site opens in a new tab`);
  }

  // content pages
  const address = "/" + name.replace(/\.html$/, "");
  const cp = contentByAddress.get(address);
  if (cp) {
    count.contentPages++;
    const art = (html.match(/<article[\s\S]*<\/article>/) || [""])[0];
    // after the structured-data scripts, the Back button is the first thing of the article
    if (!/<article[^>]*>(?:\s*<script[\s\S]*?<\/script>)*\s*<nav aria-label="Back" data-back/.test(art)) bad(`${name}: the Back button is not the first thing in the content`);
    const back = (art.match(/<nav aria-label="Back" data-back[^>]*>[\s\S]*?<\/nav>/) || [""])[0];
    if (!back.includes(`href="${SITE}${cp.hub}"`)) bad(`${name}: the Back button does not go to ${cp.hub} (${(back.match(/href="([^"]*)"/) || [])[1]})`);
    if (!/&larr;|←/.test(back) || !/Back to /.test(back)) bad(`${name}: the Back button has no arrow or label`);
    // the content block: from its <div data-content> to the matching </div> (the link below it, "Back to ...", is not content)
    const startAt = art.search(/<div class="[^"]*" data-content[^>]*>/);
    let content = "";
    if (startAt >= 0) {
      let depth = 0;
      for (const m of art.slice(startAt).matchAll(/<div\b|<\/div>/g)) {
        depth += m[0] === "</div>" ? -1 : 1;
        if (depth === 0) {
          content = art.slice(startAt, startAt + m.index + 6);
          break;
        }
      }
    }
    if (!content) bad(`${name}: the content block (data-content) was not found`);
    for (const m of content.matchAll(/<a\b([^>]*)>/g)) {
      count.contentLinks++;
      const attrs = m[1];
      if (!/target="_blank"/.test(attrs)) bad(`${name}: a content link does not open in a new tab (${(attrs.match(/href="([^"]*)"/) || [])[1]})`);
      if (!/rel="noopener"/.test(attrs)) bad(`${name}: a content link has no rel="noopener"`);
      if (/noreferrer/.test(attrs)) bad(`${name}: a content link has noreferrer`);
    }
  }
}

// list pages
for (const [kind, label] of [["glossary", "Glossary"], ["faq", "FAQ"], ["legislation", "Legislation"]]) {
  const addr = `/us/${kind}`;
  const f = path.join(OUT, `us/${kind}.html`);
  if (!fs.existsSync(f)) {
    bad(`${addr}: the list page does not exist`);
    continue;
  }
  const html = fs.readFileSync(f, "utf8");
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) bad(`${addr}: the list page is noindex`);
  if (!html.includes(`<link rel="canonical" href="${SITE}${addr}"`)) bad(`${addr}: the canonical link is not its own address`);
  if (!sitemap.includes(`<loc>${SITE}${addr}</loc>`)) bad(`${addr}: not in the sitemap`);
  const list = (html.match(/<ul[^>]*data-hub-list[^>]*>[\s\S]*?<\/ul>/) || [""])[0];
  const missing = byKind[kind].filter((a) => !list.includes(`href="${SITE}${a}"`));
  if (missing.length) bad(`${addr}: does not link to ${missing.length} page(s), e.g. ${missing[0]}`);
  const listed = (list.match(/<li>/g) || []).length;
  if (listed !== byKind[kind].length) bad(`${addr}: lists ${listed} page(s), the content has ${byKind[kind].length}`);
  console.log(`${addr}: ${listed} page(s) listed, ${label} list page indexable, canonical and in the sitemap`);
}

console.log(`${count.pages} page(s) checked, ${count.contentPages} content page(s) with the Back button, ${count.contentLinks} content link(s) opening in a new tab, ${problems.length} problem(s).`);
for (const p of problems.slice(0, 40)) console.log(`::error::${p}`);
process.exit(problems.length ? 1 : 0);
