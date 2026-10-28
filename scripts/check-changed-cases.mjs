// Checks on the case files a change touches. Run by the pull-request check
// (.github/workflows/check.yml) and by hand:
//
//   node scripts/check-changed-cases.mjs [--base origin/main] [--content]
//
// FORMAT CHECK (always). For every case file added or changed since the base:
//   - the required fields are filled (and a source link, if given, is a link);
//   - no "Works cited" / "References" section, and no [cite: n] markers;
//   - the text is split into blocks (a block over 6000 characters, or with
//     line breaks inside it, is the whole report pasted as one paragraph);
//   - no PDF is attached (the site does not publish PDFs).
// Problems that were already in the file before the change do not block.
// Footnote numbers stuck to words, a long summary and a missing decision date
// are notices only.
//
// CONTENT CHECK (only with --content; the pull-request check does not run it;
// kept for when decision texts are supplied again). For every case file added
// or changed since the base:
//   - the PDF it points to exists, is a PDF, and has readable text (a scan is
//     rejected: it needs a text version);
//   - the number-and-quote check runs against that PDF. A published case may
//     not gain a number or a quoted phrase that the decision does not
//     contain. Items that were already on the page before the change are
//     reported but do not block (so a typo fix on an older page is not
//     held up); a draft or withdrawn case never blocks;
//   - an English translation may not contain a number its case does not.
// And, as notices only: a new case whose PDF is not named <slug>.pdf, PDFs no
// case uses any more, a case without a PDF.
//
// Exit code 1 when something blocks. Messages are also written as GitHub
// annotations (::error / ::warning).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkRecord, pdfText } from "./lib/check.mjs";
import { hasMarkup, inlineProblems, plainText } from "../src/lib/inline-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const args = process.argv.slice(2);
const baseIdx = args.indexOf("--base");
const BASE = baseIdx >= 0 ? args[baseIdx + 1] : "origin/main";
const CONTENT = args.includes("--content");

const git = (...a) =>
  execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

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
const note = (msg) => console.log(msg);

function changedFiles() {
  let out;
  try {
    out = git("diff", "--name-status", "--no-renames", `${BASE}...HEAD`, "--", "content/cases", "content/translations", "public/documents");
  } catch {
    out = git("diff", "--name-status", "--no-renames", BASE, "--", "content/cases", "content/translations", "public/documents");
  }
  return out
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [status, ...rest] = l.split("\t");
      return { status: status[0], file: rest.join("\t") };
    });
}

function readAtBase(file) {
  try {
    return JSON.parse(git("show", `${BASE}:${file}`));
  } catch {
    return null;
  }
}

const keyOf = (i) => `${i.kind}:${i.text}`;

function sourceFor(rec) {
  if (!rec.sourcePdfPath) return { text: null };
  const pdf = path.join(ROOT, "public", rec.sourcePdfPath.replace(/^\//, ""));
  if (!fs.existsSync(pdf)) return { error: `${rec.sourcePdfPath} does not exist in public/` };
  const head = fs.readFileSync(pdf).subarray(0, 4).toString();
  if (head !== "%PDF") return { error: `${rec.sourcePdfPath} is not a PDF file` };
  const text = pdfText(pdf);
  const words = text.split(/\s+/).filter(Boolean).length;
  const chars = text.replace(/\s+/g, "").length;
  // Counted in characters too, because Chinese, Japanese, Korean and Thai
  // have no spaces between words.
  if (words < 150 && chars < 600) {
    return { error: `${rec.sourcePdfPath} has no readable text (a scan?). It needs a text version.` };
  }
  return { text };
}

const textsOf = (rec) =>
  [rec.title, rec.articleTitle, rec.summary, rec.outcome]
    .filter(Boolean)
    .map((t) => ({ where: "the header fields", text: t, markup: false }))
    .concat(
      (rec.body ?? []).flatMap((b, i) => {
        const at = `block ${i + 1}`;
        if (b.type === "list") return b.items.map((t) => ({ where: at, text: t, block: b, markup: true }));
        if (b.type === "table")
          return [
            ...[b.caption, ...b.headers].filter(Boolean).map((t) => ({ where: at, text: t, block: b, markup: false })),
            ...b.rows.flatMap((r) => (Array.isArray(r) ? r : r.cells)).filter(Boolean).map((t) => ({ where: at, text: t, block: b, markup: true })),
          ];
        return [{ where: at, text: b.text ?? "", block: b, markup: b.type === "paragraph" }];
      }),
    );

const SECTION = /^(works cited|references|sources|bibliography|footnotes|notes)\s*:?$/i;
const GLUED = /[a-z)\]”"’]\d{1,3}(?=[\s.,;:)”"’]|$)/g;
const SENTENCES = (t) => (t.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [t]).length;

/** Format problems of a case: { blocking: [...], notices: [...] }, each a short sentence. */
function formatProblems(rec) {
  const blocking = [];
  const notices = [];
  for (const k of ["title", "caseNumber", "subject", "jurisdictionGroup", "jurisdictionSlug", "summary"]) {
    if (typeof rec[k] !== "string" || !rec[k].trim()) blocking.push(`The field "${k}" is empty.`);
  }
  if (!Number.isInteger(rec.year)) blocking.push('The field "year" must be a whole number.');
  if (rec.jurisdictionGroup === "country") {
    if (!/^[A-Z]{2}$/.test(rec.country ?? "")) blocking.push('The field "country" must be a two-letter country code, e.g. AU.');
    if (!rec.court?.trim()) blocking.push('The field "court" (the deciding court) is empty.');
    if (!rec.decisionDate) notices.push("The decision date is empty.");
  }
  if (rec.sourceDocUrl !== undefined && rec.sourceDocUrl !== "" && !/^https?:\/\/\S+$/.test(rec.sourceDocUrl)) {
    blocking.push(`The source link "${String(rec.sourceDocUrl).slice(0, 40)}" is not a web address. Leave it empty if there is none.`);
  }
  if (rec.sourcePdfPath) blocking.push("A PDF is attached. The site does not publish PDFs: clear the PDF field.");
  if (!Array.isArray(rec.body) || !rec.body.length) blocking.push("The body is empty.");
  let glued = 0;
  for (const { where, text: stored, block, markup } of textsOf(rec)) {
    // links and emphasis are allowed only in paragraphs, list items and table cells
    if (markup) {
      for (const m of new Set(inlineProblems(stored))) blocking.push(`${where}: ${m}.`);
    } else if (hasMarkup(stored)) {
      blocking.push(`${where} has a link or emphasis tag. Links and emphasis are allowed only in paragraphs, list items and table cells.`);
    }
    const text = plainText(stored);
    const t = text.trim();
    const refs = SECTION.test(t) ? t : text.match(/(^|\n)\s*(works cited|references)\s*\n/i)?.[2];
    if (refs) blocking.push(`${where} is or holds a "${refs.slice(0, 30)}" section. Remove the references list.`);
    if (/\[cite[^\]]*\]/i.test(text)) blocking.push(`${where} has a [cite: n] marker. Remove it.`);
    if (block && block.type === "paragraph" && (text.length > 6000 || /\n/.test(text))) {
      blocking.push(
        `${where} is one block of ${text.length} characters${/\n/.test(text) ? " with line breaks inside" : ""}. Split the text into headings, paragraphs, lists and tables.`,
      );
    }
    glued += (text.match(GLUED) ?? []).length;
  }
  if (glued >= 3) notices.push(`${glued} places look like footnote numbers stuck to a word (for example "1997)3"). Remove them.`);
  if (rec.summary && (SENTENCES(rec.summary) > 6 || rec.summary.length > 1200)) {
    notices.push("The summary is long. Two to four sentences is the aim.");
  }
  return { blocking, notices };
}

const changes = changedFiles();
const caseChanges = changes.filter((c) => /^content\/cases\/[^/]+\.json$/.test(c.file));
const trChanges = changes.filter((c) => /^content\/translations\/[^/]+\.json$/.test(c.file));
const pdfChanges = changes.filter((c) => /^public\/documents\//.test(c.file));

note(
  `Checking ${caseChanges.length} case file(s), ${trChanges.length} translation file(s), ${pdfChanges.length} document file(s) against ${BASE}.`,
);

for (const ch of changes.filter((c) => /^public\/documents\//.test(c.file) && c.status !== "D")) {
  error(ch.file, "A PDF was added or changed. The site does not publish PDFs: do not add files to public/documents.");
}
for (const ch of caseChanges.filter((c) => c.status !== "D")) {
  const rec = JSON.parse(fs.readFileSync(path.join(ROOT, ch.file), "utf8"));
  const now = formatProblems(rec);
  const before = ch.status === "A" ? null : readAtBase(ch.file);
  const had = new Set(before ? formatProblems(before).blocking : []);
  for (const m of now.blocking.filter((m) => !had.has(m))) error(ch.file, m);
  for (const m of now.blocking.filter((m) => had.has(m))) warn(ch.file, `${m} (already there before this change; not blocking)`);
  for (const m of now.notices) warn(ch.file, m);
  if (!now.blocking.length && !now.notices.length) note(`${ch.file}: format ok`);
}

const referenced = new Set();
for (const f of fs.readdirSync(path.join(ROOT, "content", "cases"))) {
  if (!f.endsWith(".json")) continue;
  const c = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "cases", f), "utf8"));
  if (c.sourcePdfPath) referenced.add(c.sourcePdfPath.replace(/^\//, ""));
}

for (const ch of CONTENT ? caseChanges : []) {
  if (ch.status === "D") {
    const gone = readAtBase(ch.file);
    const pdf = gone?.sourcePdfPath?.replace(/^\//, "");
    if (pdf && !referenced.has(pdf) && fs.existsSync(path.join(ROOT, "public", pdf))) {
      warn(ch.file, `The case was deleted but its PDF public/${pdf} is still in the repository. Delete the PDF too if nothing else uses it.`);
    }
    continue;
  }
  const file = ch.file;
  const rec = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
  const isNew = ch.status === "A";
  const blocking = (rec.status ?? "published") === "published";

  if (isNew && rec.sourcePdfPath && rec.sourcePdfPath !== `/documents/${rec.slug}.pdf`) {
    warn(file, `Name the PDF after the case: expected /documents/${rec.slug}.pdf, found ${rec.sourcePdfPath}.`);
  }

  const src = sourceFor(rec);
  if (src.error) {
    // A scanned PDF that was already attached before this change is not the
    // editor's doing: say so, but do not hold up the edit.
    const before0 = isNew ? null : readAtBase(file);
    const unchangedPdf = before0 && before0.sourcePdfPath === rec.sourcePdfPath;
    const isScan = /no readable text/.test(src.error);
    const holdOver = isScan && unchangedPdf;
    (blocking && !holdOver ? error : warn)(
      file,
      holdOver
        ? `${src.error} The number-and-quote check could not run on this case; the approver must check the source by hand.`
        : src.error,
    );
    continue;
  }
  if (src.text === null) {
    warn(file, "No PDF is attached, so the number-and-quote check could not run. The approver must check the source by hand.");
    continue;
  }

  const items = checkRecord(rec, src.text);
  const before = isNew ? null : readAtBase(file);
  const beforeKeys = before ? new Set(checkRecord(before, src.text).map(keyOf)) : new Set();
  const added = items.filter((i) => !beforeKeys.has(keyOf(i)));
  const inherited = items.length - added.length;

  if (added.length) {
    const sample = added.slice(0, 6).map((i) => `${i.kind} "${i.text.slice(0, 70)}"`).join("; ");
    const msg = `${added.length} number(s) or quoted phrase(s) on this page are not in the decision: ${sample}${added.length > 6 ? "; ..." : ""}. Remove them, or have the reviewer give a source.`;
    (blocking ? error : warn)(file, msg);
  }
  if (inherited) {
    note(`${file}: ${inherited} item(s) were already on the page before this change (not blocking).`);
  }
  if (!added.length) note(`${file}: ok`);
}

for (const ch of trChanges) {
  if (ch.status === "D") continue;
  const file = ch.file;
  const slug = path.basename(file, ".json");
  const casePath = path.join(ROOT, "content", "cases", `${slug}.json`);
  if (!fs.existsSync(casePath)) {
    error(file, `There is no case content/cases/${slug}.json for this translation.`);
    continue;
  }
  const tr = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
  const c = JSON.parse(fs.readFileSync(casePath, "utf8"));
  // The case's own page text is the source here: a translation may not add
  // a number the case does not contain.
  const pageText = [c.title, c.articleTitle, c.summary]
    .concat(
      c.body.flatMap((b) =>
        b.type === "list"
          ? b.items
          : b.type === "table"
            ? [b.caption, ...b.headers, ...b.rows.flatMap((r) => (Array.isArray(r) ? r : r.cells))]
            : [b.text],
      ),
    )
    .filter(Boolean)
    .join("\n");
  const items = checkRecord(
    { title: tr.title, articleTitle: tr.articleTitle, summary: tr.summary, body: tr.body },
    pageText,
  ).filter((i) => i.kind === "number");
  const bodyDiff = tr.body.length !== c.body.length;
  if (items.length) {
    error(file, `The translation has ${items.length} number(s) that the case text does not: ${items.slice(0, 6).map((i) => i.text).join(", ")}.`);
  }
  if (bodyDiff) {
    warn(file, `The translation has ${tr.body.length} blocks and the case has ${c.body.length}. A translation follows the case block for block.`);
  }
  if (!items.length) note(`${file}: ok`);
}

// Notices about documents nothing uses (whole repository, not only this change).
const docsDir = path.join(ROOT, "public", "documents");
const orphans = (fs.existsSync(docsDir) ? fs.readdirSync(docsDir) : [])
  .filter((f) => f.toLowerCase().endsWith(".pdf") && !referenced.has(`documents/${f}`));
if (CONTENT && orphans.length) {
  warn("public/documents", `${orphans.length} PDF(s) in public/documents are not used by any case: ${orphans.slice(0, 8).join(", ")}${orphans.length > 8 ? ", ..." : ""}.`);
}

note(`\n${errors} problem(s) that block, ${warnings} notice(s).`);
process.exit(errors ? 1 : 0);
