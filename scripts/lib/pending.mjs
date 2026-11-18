// The pending list (content/pending-pages.json): addresses of this site that texts link to and that do not exist yet.
// A link to one of them is shown as plain text until the page exists (src/lib/known-addresses.ts); the link checker reports
// them as notices. refreshPending() rebuilds the list from the content: every internal link target that is not a page yet.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { linksIn } from "../../src/lib/inline-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..", "..");
const PENDING_FILE = path.join(ROOT, "content", "pending-pages.json");

function walkJson(d, acc = []) {
  if (!fs.existsSync(d)) return acc;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walkJson(p, acc);
    else if (e.name.endsWith(".json")) acc.push(p);
  }
  return acc.sort();
}

/** Texts of a body: paragraphs, list items, table cells (headings and captions have no links). */
export const textsOf = (body) =>
  (body ?? []).flatMap((b) => (b.type === "paragraph" ? [b.text] : b.type === "list" ? b.items : b.type === "table" ? b.rows.flatMap((r) => (Array.isArray(r) ? r : r.cells)) : []));

/** Every page of the content: { address, status, file, body, kind: "case" | "page" }. */
export function allContent() {
  const out = [];
  const casesDir = path.join(ROOT, "content", "cases");
  for (const f of fs.readdirSync(casesDir).filter((x) => x.endsWith(".json")).sort()) {
    const c = JSON.parse(fs.readFileSync(path.join(casesDir, f), "utf8"));
    out.push({ address: c.jurisdictionGroup === "country" ? `/${c.jurisdictionSlug}/${c.slug}` : `/us/${c.slug}`, status: c.status ?? "published", file: `content/cases/${f}`, body: c.body, kind: "case" });
  }
  const pagesDir = path.join(ROOT, "content", "pages");
  for (const f of walkJson(pagesDir)) {
    const p = JSON.parse(fs.readFileSync(f, "utf8"));
    out.push({ address: "/" + path.relative(pagesDir, f).split(path.sep).join("/").replace(/\.json$/, ""), status: p.status ?? "published", file: path.relative(ROOT, f).split(path.sep).join("/"), body: p.body, kind: "page" });
  }
  return out;
}

const FIXED = new Set(["/", "/about", "/contact", "/copyright", "/search", "/us", "/us/federal", "/us/states", "/us/glossary", "/us/faq", "/us/legislation"]);
export function isExisting(address, content, countryCodes) {
  if (FIXED.has(address) || /^\/us\/states\/[a-z-]+$/.test(address)) return true;
  if (/^\/[a-z]{2}$/.test(address) && countryCodes.has(address.slice(1))) return true;
  return content.some((c) => c.address === address && c.status !== "draft" && (c.kind !== "case" || c.status === "published"));
}

/** Rebuild the pending list. Entries keep their `from` data. Returns { pending, added, removed }. */
export function refreshPending({ write = true } = {}) {
  const siteMap = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "site-map.json"), "utf8"));
  const codes = new Set(Object.keys(siteMap.countries));
  const content = allContent();
  const old = fs.existsSync(PENDING_FILE) ? JSON.parse(fs.readFileSync(PENDING_FILE, "utf8")) : { note: "", pages: [] };
  const oldBy = new Map(old.pages.map((p) => [p.address, p]));
  const targets = new Map(); // address -> Set of source addresses
  for (const c of content) {
    if (c.status === "draft") continue;
    for (const t of textsOf(c.body))
      for (const l of linksIn(t)) {
        if (!l.href.startsWith("/")) continue;
        const a = l.href.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
        if (isExisting(a, content, codes)) continue;
        if (!targets.has(a)) targets.set(a, new Set());
        targets.get(a).add(c.address);
      }
  }
  const type = (a) => (/\/(glossary|glossario)\//.test(a) ? "glossary" : /\/legislation\//.test(a) ? "legislation" : /\/faq\//.test(a) ? "faq" : "other");
  const pages = [...targets.keys()].map((a) => ({ ...(oldBy.get(a) ?? { address: a, type: type(a) }), linkedFrom: [...targets.get(a)].length }));
  const order = { glossary: 0, legislation: 1, faq: 2, other: 3 };
  pages.sort((a, b) => (order[a.type] ?? 3) - (order[b.type] ?? 3) || a.address.localeCompare(b.address));
  const added = pages.filter((p) => !oldBy.has(p.address)).map((p) => p.address);
  const removed = old.pages.filter((p) => !targets.has(p.address)).map((p) => p.address);
  if (write) {
    const clean = pages.map((p) => {
      const o = { ...p };
      delete o.linkedFrom; // only for the report
      return o;
    });
    fs.writeFileSync(PENDING_FILE, JSON.stringify({ note: old.note, pages: clean }, null, 2) + "\n");
  }
  return { pending: pages, added, removed };
}
