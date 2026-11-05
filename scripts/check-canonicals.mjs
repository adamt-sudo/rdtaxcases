// Checks the built site (out/): every indexable page has exactly one
// <link rel="canonical"> and it is the page's own address.
//
// Usage: node scripts/check-canonicals.mjs [out-folder]
// Exit code 1 when a page is wrong. Pages marked noindex and the error pages
// are skipped.
import fs from "node:fs";
import path from "node:path";

const SITE = "https://rdtaxcases.com";
const OUT = path.resolve(process.argv[2] ?? "out");

function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === "_next") continue;
      yield* walk(p);
    } else if (e.name.endsWith(".html")) yield p;
  }
}

let pages = 0;
const problems = [];
for (const file of walk(OUT)) {
  const rel = path.relative(OUT, file).split(path.sep).join("/");
  if (/^(404|_not-found)\.html$/.test(rel)) continue;
  const html = fs.readFileSync(file, "utf8");
  if (/<meta name="robots" content="[^"]*noindex/i.test(html)) continue;
  pages++;
  const route = rel === "index.html" ? "/" : "/" + rel.replace(/\.html$/, "");
  const want = route === "/" ? SITE : SITE + route; // Next writes the home page canonical without a slash
  const found = [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]);
  if (found.length === 0) problems.push(`${route}: no canonical link`);
  else if (found.length > 1) problems.push(`${route}: ${found.length} canonical links`);
  else if (found[0] !== want) problems.push(`${route}: canonical is ${found[0]}, expected ${want}`);
}
console.log(`${pages} indexable page(s) checked, ${problems.length} problem(s).`);
for (const p of problems.slice(0, 30)) console.log("  " + p);
process.exit(problems.length ? 1 : 0);
