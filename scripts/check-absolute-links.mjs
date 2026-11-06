// After `next build`: the rendered HTML (out/) must say full addresses, not paths.
//   - every <a href> to this site is https://rdtaxcases.com/... (no "/us/federal", no "www", no http)
//   - the canonical link is absolute, and so are the URLs in the structured data (url, @id, item, mainEntityOfPage)
// The page text in content/ stays path-based; the renderer writes the full address (src/components/SiteLink.tsx,
// InlineText.tsx, src/lib/urls.ts). The editor (out/admin) and the dropdown option values are not links and are skipped.
//   node scripts/check-absolute-links.mjs [out-dir]
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(process.argv[2] ?? "out");
const SITE = "https://rdtaxcases.com";

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name !== "admin" && e.name !== "_next") walk(p, acc);
    } else if (e.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

const problems = [];
const counts = { pages: 0, links: 0, schemaUrls: 0 };
const bad = (file, m) => {
  if (problems.length < 40) problems.push(`${path.relative(OUT, file)}: ${m}`);
  else if (problems.length === 40) problems.push("...");
};

for (const file of walk(OUT)) {
  const html = fs.readFileSync(file, "utf8");
  counts.pages++;
  for (const m of html.matchAll(/<a\b[^>]*?\bhref="([^"]*)"/g)) {
    const href = m[1];
    counts.links++;
    if (href.startsWith("/")) bad(file, `link ${href} is a path: the rendered HTML needs ${SITE}${href}`);
    else if (/^https?:\/\/(www\.)?rdtaxcases\.com/i.test(href) && !href.startsWith(SITE)) bad(file, `link ${href}: this site's address is ${SITE} (https, no www)`);
  }
  const canon = html.match(/<link rel="canonical" href="([^"]*)"/);
  if (canon && !canon[1].startsWith(SITE)) bad(file, `canonical ${canon[1]} is not an absolute address of ${SITE}`);
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let json;
    try {
      json = JSON.parse(m[1]);
    } catch {
      bad(file, "structured data is not valid JSON");
      continue;
    }
    const walkJson = (v, key) => {
      if (Array.isArray(v)) v.forEach((x) => walkJson(x, key));
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walkJson(x, k);
      else if (typeof v === "string" && ["url", "@id", "item", "sameAs"].includes(key)) {
        counts.schemaUrls++;
        if (v.startsWith("/")) bad(file, `structured data ${key} "${v}" is a path`);
      }
    };
    walkJson(json, "");
  }
}

console.log(`${counts.pages} page(s), ${counts.links} link(s), ${counts.schemaUrls} structured-data URL(s) checked, ${problems.length} problem(s).`);
for (const p of problems) console.log(`::error::${p}`);
process.exit(problems.length ? 1 : 0);
