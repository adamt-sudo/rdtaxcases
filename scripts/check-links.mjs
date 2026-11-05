// Link checker for the links inside case text (paragraphs, list items, table cells).
//
//   node scripts/check-links.mjs [--base origin/main]   cases added or changed since the base
//   node scripts/check-links.mjs --all                  every case
//   node scripts/check-links.mjs --slug a,b             the named cases
//
// Links to this site (a path, or rdtaxcases.com) are checked against the case list and the
// known pages, without the network. An address listed in content/pending-pages.json is a page the
// delivery will add: it is reported as pending and does not block. Any other unknown address blocks. Every other allowed link (swansonreed.com) is requested:
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

// Addresses of the case pages (path -> published?), and the pages that are not cases.
const published = new Map();
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
  const c = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  const addr = c.jurisdictionGroup === "country" ? `/${c.jurisdictionSlug}/${c.slug}` : `/us/${c.slug}`;
  published.set(addr, (c.status ?? "published") === "published");
}
const STATIC = new Set(["/", "/about", "/contact", "/copyright", "/search", "/us", "/us/federal", "/us/states"]);
const PENDING_FILE = path.join(ROOT, "content", "pending-pages.json");
const pending = new Set(fs.existsSync(PENDING_FILE) ? JSON.parse(fs.readFileSync(PENDING_FILE, "utf8")).pages.map((p) => p.address) : []);
const pendingHits = new Map(); // file -> Set of addresses

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
    const raw = own.split(/[?#]/)[0] || "/";
    const p = raw.replace(/\/$/, "") || "/";
    for (const file of files) {
      // the address rules for links: lowercase, no trailing slash, no .html
      if (raw !== "/" && (raw.endsWith("/") || /[A-Z]/.test(raw) || raw.endsWith(".html"))) {
        error(file, `The link ${href} breaks the address rules (lowercase, no trailing slash, no .html): the server answers 403 or 404 for it.`);
      }
      if (published.has(p)) {
        if (!published.get(p)) error(file, `The link ${href} goes to a case that is not published (a draft or withdrawn).`);
      } else if (STATIC.has(p) || p.startsWith("/us/states/") || /^\/[a-z]{2}$/.test(p)) {
        // a page of the site
      } else if (pending.has(p)) {
        if (!pendingHits.has(file)) pendingHits.set(file, new Set());
        pendingHits.get(file).add(p);
      } else {
        error(file, `The link ${href} goes to an address that is neither a page of the site nor listed as pending.`);
      }
    }
  } else external.push(href);
}

for (const [file, set] of pendingHits) {
  warn(file, `${set.size} address(es) linked from this case are pending (the pages are not delivered yet, see content/pending-pages.json): ${[...set].slice(0, 4).join(", ")}${set.size > 4 ? ", ..." : ""}.`);
}
for (const a of pending) {
  if (published.has(a) || STATIC.has(a)) warn("content/pending-pages.json", `The page ${a} exists now: remove it from the pending list.`);
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
