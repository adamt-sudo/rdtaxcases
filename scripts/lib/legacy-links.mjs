// Links in the texts that use an old address of a case (/cases/<slug>, /usa/..., or /us/<old slug> of a case whose slug changed) are
// written with the case's current address (/us/<slug>), so that no text depends on a redirect.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./pending.mjs";

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

/** Rewrites the files in place. Returns the number of links changed: [{ file, from, to }]. */
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
  const changed = [];
  for (const file of contentFiles()) {
    const raw = fs.readFileSync(file, "utf8");
    const nl = raw.includes("\r\n") ? "\r\n" : "\n";
    const rec = JSON.parse(raw);
    let n = 0;
    const fix = (t) =>
      t.replace(/href="(\/[^"#?]*)([^"]*)"/g, (m, p, rest) => {
        const to = map.get(p.replace(/\/+$/, ""));
        if (!to || to === p) return m;
        n++;
        changed.push({ file: path.relative(ROOT, file), from: p + rest, to: to + rest });
        return `href="${to}${rest}"`;
      });
    for (const b of rec.body ?? []) {
      if (typeof b.text === "string") b.text = fix(b.text);
      if (b.items) b.items = b.items.map(fix);
      if (b.rows) b.rows = b.rows.map((r) => (Array.isArray(r) ? r.map(fix) : { ...r, cells: r.cells.map(fix) }));
    }
    if (n && write) fs.writeFileSync(file, JSON.stringify(rec, null, 2).replace(/\n/g, nl) + (raw.endsWith("\n") ? nl : ""));
  }
  return changed;
}
