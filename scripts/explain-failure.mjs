// Turns the red lines of a failed check or build into plain instructions for the person who published: which page, which box
// (field), and where to fix it in /admin. Used by .github/workflows/deploy.yml, which writes the result into the run's summary
// (the page that the failure email links to).
//
//   node scripts/explain-failure.mjs <log file> [<log file> ...]     writes Markdown to the standard output
//
// It reads the "::error file=<path>::<message>" lines the checks write (scripts/check-changed-cases.mjs, check-links.mjs and the
// index builders). The messages already name the box ('The field "Court" is empty.'); this adds the page and the list to open.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteMap = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "site-map.json"), "utf8"));
const COUNTRY = { us: "USA", ca: "Canada" };
const SECTION = { glossary: "glossary", faq: "FAQ", legislation: "legislation" };

const readJson = (rel) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
};

/** Where a content file is in /admin: { list, name, address } or null for any other file. */
export function whereInEditor(file) {
  const c = file?.match(/^content\/cases\/([^/]+)\.json$/);
  if (c) {
    const rec = readJson(file);
    const list =
      rec?.jurisdictionGroup === "usa-federal" ? "USA federal cases"
      : rec?.jurisdictionGroup === "usa-states" ? "USA state cases"
      : rec?.jurisdictionSlug === "ca" ? "Canada cases"
      : "Country cases (other countries)";
    return { list, name: rec?.title ?? c[1], slug: c[1] };
  }
  const p = file?.match(/^content\/pages\/([a-z]{2})\/([^/]+)\/([^/]+)\.json$/);
  if (p) {
    const section = Object.entries(siteMap.countries[p[1]]?.folders ?? {}).find(([, folder]) => folder === p[2])?.[0] ?? p[2];
    const rec = readJson(file);
    return { list: `${COUNTRY[p[1]] ?? p[1].toUpperCase()} ${SECTION[section] ?? section}`, name: rec?.title ?? p[3], slug: p[3] };
  }
  return null;
}

/** The ::error lines of some log texts, as [{ file, message }] without repeats. */
export function errorsIn(texts) {
  const seen = new Set();
  const out = [];
  for (const t of texts)
    for (const line of t.split(/\r?\n/)) {
      const m = line.match(/^::error(?: file=([^,:]+))?[^:]*::(.*)$/);
      if (!m) continue;
      const key = `${m[1] ?? ""}|${m[2]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ file: m[1] ?? null, message: m[2].trim() });
    }
  return out;
}

export function explain(texts) {
  const errors = errorsIn(texts);
  if (!errors.length) {
    return [
      "### What to fix",
      "",
      "The failed step above has red lines: the first one says what is wrong. If it is not clear, take a screenshot of the failed step and send it to the developer.",
    ].join("\n");
  }
  const byFile = new Map();
  for (const e of errors) {
    const k = e.file ?? "";
    if (!byFile.has(k)) byFile.set(k, []);
    byFile.get(k).push(e.message);
  }
  const lines = ["### What to fix", ""];
  let n = 0;
  for (const [file, messages] of byFile) {
    if (++n > 20) {
      lines.push(`...and ${byFile.size - 20} more page(s): see the failed step.`);
      break;
    }
    const w = whereInEditor(file);
    if (w) {
      lines.push(`**${w.list}: "${w.name}"** (address ending \`${w.slug}\`)`);
      for (const m of messages) lines.push(`- ${m}`);
      lines.push(`- In /admin: open **${w.list}**, click this entry, fix the box named above, and click **Publish** again.`);
    } else {
      lines.push(file ? `**File \`${file}\`** (not a page you edit in /admin)` : "**Another problem**");
      for (const m of messages) lines.push(`- ${m}`);
      lines.push("- Tell the developer: this one is not fixed in /admin.");
    }
    lines.push("");
  }
  lines.push("Until this is fixed, nothing new goes live (the live site stays as it was). After you publish the fix, the checks run again by themselves.");
  return lines.join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const texts = process.argv.slice(2).filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, "utf8"));
  console.log(explain(texts));
}
