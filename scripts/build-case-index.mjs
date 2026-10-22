// Build src/data/cases.index.ts from content/cases/*.json.
//
// Every case is one JSON file, content/cases/<slug>.json. This script lists
// them in a generated module so the site imports them statically (static
// export, and client components import the case list). It runs before every
// build and dev start (npm "prebuild" and "predev"). It also checks the
// files, so a bad case fails the build with a clear message.
//
// Listing order: the slugs in content/case-order.json first, in that order,
// then any other case file in alphabetical order of its slug (so a new case
// is added at the end without editing the order file).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "content", "cases");
const ORDER_FILE = path.join(ROOT, "content", "case-order.json");
const OUT = path.join(ROOT, "src", "data", "cases.index.ts");
const TDIR = path.join(ROOT, "content", "translations");

const BLOCK_TYPES = new Set(["paragraph", "heading", "subheading", "list", "table"]);
const GROUPS = new Set(["usa-states", "usa-federal", "country"]);
const STATUSES = new Set(["draft", "published", "withdrawn"]);

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
let raggedTables = 0;
const bySlug = new Map();
const problems = [];

for (const f of files) {
  const slug = f.replace(/\.json$/, "");
  let c;
  try {
    c = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  } catch (e) {
    problems.push(`${f}: not valid JSON (${e.message})`);
    continue;
  }
  const bad = (m) => problems.push(`${f}: ${m}`);
  if (c.slug !== slug) bad(`slug "${c.slug}" does not match the file name`);
  for (const k of ["title", "caseNumber", "subject", "jurisdictionGroup", "jurisdictionSlug", "sourceDocUrl", "summary"]) {
    if (typeof c[k] !== "string" || !c[k].trim()) bad(`"${k}" is missing`);
  }
  if (!Number.isInteger(c.year)) bad(`"year" must be a whole number`);
  if (!GROUPS.has(c.jurisdictionGroup)) bad(`unknown jurisdictionGroup "${c.jurisdictionGroup}"`);
  if (c.status !== undefined && !STATUSES.has(c.status)) bad(`unknown status "${c.status}"`);
  if (c.sourcePdfPath && !fs.existsSync(path.join(ROOT, "public", c.sourcePdfPath))) {
    bad(`sourcePdfPath ${c.sourcePdfPath} does not exist in public/`);
  }
  if (!Array.isArray(c.body) || c.body.length === 0) bad(`"body" is empty`);
  else {
    c.body.forEach((b, i) => {
      if (!BLOCK_TYPES.has(b.type)) bad(`block ${i + 1}: unknown type "${b.type}"`);
      if (b.type === "table") {
        const width = (r) => (Array.isArray(r) ? r.length : r?.cells?.length);
        const w = b.headers?.length;
        if (!w || b.rows.some((r) => width(r) === undefined)) {
          bad(`block ${i + 1}: a table needs headers and rows of cells`);
        } else if (b.rows.some((r) => width(r) !== w)) {
          // Counted, not failed: some imported source tables are ragged.
          raggedTables++;
        }
      }
    });
  }
  if (c.translation) {
    bad(`has an inline "translation"; translations live in content/translations/${slug}.json`);
  }
  bySlug.set(slug, c);
}

// English translations: one file per case, content/translations/<slug>.json.
const trBySlug = new Map();
if (fs.existsSync(TDIR)) {
  for (const f of fs.readdirSync(TDIR).filter((x) => x.endsWith(".json")).sort()) {
    const slug = f.replace(/\.json$/, "");
    let t;
    try {
      t = JSON.parse(fs.readFileSync(path.join(TDIR, f), "utf8"));
    } catch (e) {
      problems.push(`translations/${f}: not valid JSON (${e.message})`);
      continue;
    }
    const bad = (m) => problems.push(`translations/${f}: ${m}`);
    if (!bySlug.has(slug)) bad(`no case file content/cases/${slug}.json`);
    if (t.slug !== slug) bad(`slug "${t.slug}" does not match the file name`);
    for (const k of ["locale", "title", "summary"]) {
      if (typeof t[k] !== "string" || !t[k].trim()) bad(`"${k}" is missing`);
    }
    if (typeof t.reviewed !== "boolean") bad(`"reviewed" must be true or false`);
    if (!Array.isArray(t.body) || t.body.length === 0) bad(`"body" is empty`);
    else {
      t.body.forEach((b, i) => {
        if (!BLOCK_TYPES.has(b.type)) bad(`block ${i + 1}: unknown type "${b.type}"`);
      });
      const c = bySlug.get(slug);
      if (c && c.body.length !== t.body.length) {
        console.warn(
          `note: translations/${f}: ${t.body.length} blocks, the case has ${c.body.length} (a translation follows the report block for block)`,
        );
      }
    }
    trBySlug.set(slug, t);
  }
}

if (problems.length) {
  console.error("Case files have problems:\n  " + problems.join("\n  "));
  process.exit(1);
}

let order = [];
if (fs.existsSync(ORDER_FILE)) order = JSON.parse(fs.readFileSync(ORDER_FILE, "utf8"));
const ordered = [
  ...order.filter((s) => bySlug.has(s)),
  ...[...bySlug.keys()].filter((s) => !order.includes(s)),
];

const imports = [
  ...ordered.map((s, i) => `import c${i} from "../../content/cases/${s}.json";`),
  ...[...trBySlug.keys()].sort().map((s, i) => `import t${i} from "../../content/translations/${s}.json";`),
];
const body =
  `// GENERATED by scripts/build-case-index.mjs from content/cases/*.json.\n` +
  `// Do not edit by hand; it is rebuilt before every build and dev start.\n` +
  `import type { CaseRecord } from "@/types/case";\n` +
  imports.join("\n") +
  `\n\nexport const caseRecords = [\n` +
  ordered.map((_, i) => `  c${i},`).join("\n") +
  `\n] as unknown as CaseRecord[];\n\n` +
  `export interface TranslationRecord {\n` +
  `  slug: string;\n  locale: string;\n  title: string;\n  articleTitle?: string;\n` +
  `  summary: string;\n  body: unknown[];\n  reviewed: boolean;\n}\n\n` +
  `export const translationRecords: Record<string, TranslationRecord> = {\n` +
  [...trBySlug.keys()].sort().map((s, i) => `  "${s}": t${i},`).join("\n") +
  `\n};\n`;

const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
if (prev !== body) fs.writeFileSync(OUT, body);
console.log(
  `case index: ${ordered.length} cases, ${trBySlug.size} translations` +
    (raggedTables ? ` (${raggedTables} tables have rows of different widths in the source)` : ""),
);
