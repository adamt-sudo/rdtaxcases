// Link checker for the links inside case text (paragraphs, list items, table cells).
//
//   node scripts/check-links.mjs [--base origin/main]   cases added or changed since the base
//   node scripts/check-links.mjs --all                  every case
//   node scripts/check-links.mjs --slug a,b             the named cases
//
// Links to this site (a path, or rdtaxcases.com) are checked against the case list and the
// known pages, without the network. Every other allowed link (swansonreed.com) is requested:
//   200                        ok (a redirect that ends in 200 is a notice: update the link)
//   404, 410                   BLOCKS: the link is broken
//   5xx, 403, 429, a timeout   notice only (the other site may be down, or refusing a robot)
// Messages are also written as GitHub annotations (::error / ::warning). Exit code 1 when a link blocks.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { linksIn } from "../src/lib/inline-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const args = process.argv.slice(2);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const BASE = opt("--base") ?? "origin/main";
const DIR = path.join(ROOT, "content", "cases");

const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

function targets() {
  if (args.includes("--all")) return fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
  if (opt("--slug")) return opt("--slug").split(",").map((s) => `${s.trim()}.json`);
  let out;
  try {
    out = git("diff", "--name-status", "--no-renames", `${BASE}...HEAD`, "--", "content/cases");
  } catch {
    out = git("diff", "--name-status", "--no-renames", BASE, "--", "content/cases");
  }
  return out
    .split("\n")
    .filter((l) => l && !l.startsWith("D"))
    .map((l) => path.basename(l.split("\t")[1]))
    .filter((f) => f.endsWith(".json"));
}

const textsOf = (rec) =>
  (rec.body ?? []).flatMap((b) =>
    b.type === "paragraph"
      ? [b.text]
      : b.type === "list"
        ? b.items
        : b.type === "table"
          ? b.rows.flatMap((r) => (Array.isArray(r) ? r : r.cells))
          : [],
  );

const published = new Map();
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
  const c = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  published.set(c.slug, (c.status ?? "published") === "published");
}
const STATIC = new Set(["/", "/about", "/contact", "/copyright", "/search", "/usa/federal", "/usa/states"]);

let errors = 0;
let warnings = 0;
const error = (file, msg) => {
  errors++;
  console.log(`::error file=${file}::${msg}`);
};
const warn = (file, msg) => {
  warnings++;
  console.log(`::warning file=${file}::${msg}`);
};

// collect: url -> files that use it
const uses = new Map();
for (const f of targets()) {
  const file = `content/cases/${f}`;
  if (!fs.existsSync(path.join(ROOT, file))) continue;
  const rec = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
  for (const t of textsOf(rec)) {
    for (const l of linksIn(t)) {
      if (!uses.has(l.href)) uses.set(l.href, new Set());
      uses.get(l.href).add(file);
    }
  }
}
console.log(`Checking ${uses.size} link(s) in ${new Set([...uses.values()].flatMap((s) => [...s])).size} case file(s).`);

// internal links
const external = [];
for (const [href, files] of uses) {
  const own = href.startsWith("/") ? href : href.replace(/^https:\/\/(www\.)?rdtaxcases\.com/i, "") || "/";
  if (href.startsWith("/") || /^https:\/\/(www\.)?rdtaxcases\.com/i.test(href)) {
    const p = own.split(/[?#]/)[0].replace(/\/$/, "") || "/";
    const m = p.match(/^\/cases\/([^/]+)$/);
    for (const file of files) {
      if (m) {
        if (!published.has(m[1])) error(file, `The link ${href} goes to a case that does not exist.`);
        else if (!published.get(m[1])) error(file, `The link ${href} goes to a case that is not published (a draft or withdrawn).`);
      } else if (!STATIC.has(p) && !p.startsWith("/usa/states/")) {
        warn(file, `The link ${href} is not a page this checker knows. Check it by hand.`);
      }
    }
  } else external.push(href);
}

// external links
async function request(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctl.signal,
      headers: { "user-agent": "rdtaxcases-link-check/1.0 (+https://rdtaxcases.com)", accept: "text/html,*/*" },
    });
    await res.arrayBuffer().catch(() => {});
    return { status: res.status, finalUrl: res.url };
  } catch (e) {
    return { status: 0, error: e.name === "AbortError" ? "timed out" : e.cause?.code || e.message };
  } finally {
    clearTimeout(timer);
  }
}
async function check(url) {
  let r = await request(url);
  for (let i = 0; i < 2 && (r.status === 0 || r.status >= 500); i++) {
    await new Promise((x) => setTimeout(x, 1500 * (i + 1)));
    r = await request(url);
  }
  return r;
}

const queue = [...external];
const results = new Map();
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      results.set(url, await check(url));
    }
  }),
);
let ok = 0;
for (const [url, r] of results) {
  for (const file of uses.get(url)) {
    if (r.status === 200) {
      ok++;
      const moved = r.finalUrl && r.finalUrl.replace(/\/$/, "") !== url.replace(/\/$/, "");
      if (moved) warn(file, `The link ${url} redirects to ${r.finalUrl}. Use the new address.`);
    } else if (r.status === 404 || r.status === 410) {
      error(file, `The link ${url} is broken (${r.status}).`);
    } else {
      warn(file, `The link ${url} could not be checked (${r.status || r.error}). Open it by hand.`);
    }
  }
}
console.log(`${external.length} outside link(s) requested, ${ok} answered 200.`);
console.log(`\n${errors} problem(s) that block, ${warnings} notice(s).`);
process.exit(errors ? 1 : 0);
