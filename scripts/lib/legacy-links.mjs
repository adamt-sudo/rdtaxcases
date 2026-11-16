// Link rules applied to every text of the content (cases and pages), by the importer and on request:
//   - a link to an old address of a case (/cases/<slug>, /us/<slug> of a case whose slug changed) is written with the case's current
//     address (/us/<slug>), so no text depends on a redirect;
//   - content/link-rules.json:
//       "aliases": { "/us/old-address": "/us/right-address" }   a link written with a wrong address goes to the right one
//       "removed": [ "/us/faq/never-page", "https://dead.example/x" ]   a link to a page that will never exist, or to an address that
//                                                                      is dead, is shown as plain text (the text stays), permanently
// The importer also keeps each outside address linked at most once per page (see dedupeExternalLinks).
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./pending.mjs";

const RULES_FILE = path.join(ROOT, "content", "link-rules.json");
export function loadLinkRules() {
  const r = fs.existsSync(RULES_FILE) ? JSON.parse(fs.readFileSync(RULES_FILE, "utf8")) : {};
  return { aliases: r.aliases ?? {}, removed: new Set(r.removed ?? []) };
}

function* contentFiles() {
  const casesDir = path.join(ROOT, "content", "cases");
  for (const f of fs.readdirSync(casesDir).filter((x) => x.endsWith(".json"))) yield path.join(casesDir, f);
  const walk = function* (d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) yield* walk(p);
      else if (e.name.endsWith(".json")) yield p;
    }
  };
  yield* walk(path.join(ROOT, "content", "pages"));
}

/** Apply a function to every text of a body (paragraphs, list items, table cells). */
export function mapTexts(body, fn) {
  for (const b of body ?? []) {
    if (typeof b.text === "string" && b.type === "paragraph") b.text = fn(b.text);
    if (b.items) b.items = b.items.map(fn);
    if (b.rows) b.rows = b.rows.map((r) => (Array.isArray(r) ? r.map(fn) : { ...r, cells: r.cells.map(fn) }));
  }
}

/**
 * Keep each outside address linked once in a body (the first, in reading order); a repeat is plain text.
 * Returns the number of links turned into plain text.
 */
export function dedupeExternalLinks(body) {
  const seen = new Set();
  let n = 0;
  mapTexts(body, (t) =>
    t.replace(/<a href="(https?:\/\/[^"]+)">([\s\S]*?)<\/a>/g, (m, href, inner) => {
      if (!seen.has(href)) {
        seen.add(href);
        return m;
      }
      n++;
      return inner;
    }),
  );
  return n;
}

/** Rewrites the files in place. Returns what changed: [{ file, kind, from, to }]. */
export function rewriteLegacyLinks({ write = true } = {}) {
  const casesDir = path.join(ROOT, "content", "cases");
  const slugs = new Set(fs.readdirSync(casesDir).filter((x) => x.endsWith(".json")).map((x) => x.replace(/\.json$/, "")));
  const histFile = path.join(ROOT, "content", "slug-history.json");
  const renames = fs.existsSync(histFile) ? JSON.parse(fs.readFileSync(histFile, "utf8")).renames ?? {} : {};
  const map = new Map();
  for (const s of slugs) map.set(`/cases/${s}`, `/us/${s}`);
  for (const [o, n] of Object.entries(renames)) {
    map.set(`/cases/${o}`, `/us/${n}`);
    map.set(`/us/${o}`, `/us/${n}`);
  }
  const rules = loadLinkRules();
  for (const [from, to] of Object.entries(rules.aliases)) map.set(from, to);
  const changed = [];
  for (const file of contentFiles()) {
    const raw = fs.readFileSync(file, "utf8");
    const nl = raw.includes("\r\n") ? "\r\n" : "\n";
    const rec = JSON.parse(raw);
    let n = 0;
    const rel = path.relative(ROOT, file);
    const fix = (t) =>
      t.replace(/<a href="([^"]+)">([\s\S]*?)<\/a>/g, (m, href, inner) => {
        const key = href.startsWith("/") ? href.split(/[?#]/)[0].replace(/\/+$/, "") : href;
        if (rules.removed.has(key) || rules.removed.has(href)) {
          n++;
          changed.push({ file: rel, kind: "removed", from: href, to: "(plain text)" });
          return inner;
        }
        if (href.startsWith("/")) {
          const rest = href.slice(key.length);
          const to = map.get(key);
          if (to && to !== key) {
            n++;
            changed.push({ file: rel, kind: "address", from: href, to: to + rest });
            return `<a href="${to}${rest}">${inner}</a>`;
          }
        }
        return m;
      });
    mapTexts(rec.body, fix);
    if (n && write) fs.writeFileSync(file, JSON.stringify(rec, null, 2).replace(/\n/g, nl) + (raw.endsWith("\n") ? nl : ""));
  }
  return changed;
}
