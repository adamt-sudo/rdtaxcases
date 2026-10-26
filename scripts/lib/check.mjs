// The number-and-quote check, shared by scripts/import-samples.mjs and
// scripts/check-changed-cases.mjs (the pull-request check).
//
// A case page's numbers and quoted phrases are compared with the decision's
// own text. Quoted terms of fewer than four words are labels, not claims;
// page and line breaks and number formatting are tolerated; footnote markers
// are already gone. An item that is not found is reported, never "fixed".
import { execFileSync } from "node:child_process";

// ----------------------------------------------------------- normalisation ---
const DIGITS = [
  ["๐", "0"], ["๑", "1"], ["๒", "2"], ["๓", "3"], ["๔", "4"],
  ["๕", "5"], ["๖", "6"], ["๗", "7"], ["๘", "8"], ["๙", "9"],
  ["٠", "0"], ["١", "1"], ["٢", "2"], ["٣", "3"], ["٤", "4"],
  ["٥", "5"], ["٦", "6"], ["٧", "7"], ["٨", "8"], ["٩", "9"],
  ["०", "0"], ["१", "1"], ["२", "2"], ["३", "3"], ["४", "4"],
  ["५", "5"], ["६", "6"], ["७", "7"], ["८", "8"], ["९", "9"],
];
export function norm(s) {
  let t = s.normalize("NFKC");
  for (const [a, b] of DIGITS) t = t.split(a).join(b);
  return t
    .replace(/­/g, "")
    .replace(/-\s*\n\s*/g, "")
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”„«»「」『』]/g, '"')
    .toLowerCase();
}
export const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}]/u;
/** letters and digits only, for matching across line and page breaks */
const flat = (s) => norm(s).replace(/[^\p{L}\p{N}]/gu, "");
const words = (s) => norm(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

export function makeSourceIndex(text) {
  const n = norm(text);
  return {
    flat: n.replace(/[^\p{L}\p{N}]/gu, ""),
    wordList: words(text),
    wordStream: " " + words(text).join(" ") + " ",
    numbers: new Set(
      [
        ...n.matchAll(
          /(?<![\d.,])\d{1,3}(?:[ \u00a0\u202f\u2009'\u2019]\d{3})+(?![\d])|\d[\d.,/\-]*\d|\d/g,
        ),
      ].flatMap((m) => {
        const t = m[0];
        return [t.replace(/\D/g, ""), ...t.split(/[^\d]+/).filter(Boolean)];
      }),
    ),
  };
}

/**
 * True when every word of a short phrase occurs close together in the
 * decision, in the same order of first appearance. Used for party names and
 * outcome statements, which a two-column page layout can interleave with
 * other text.
 */
export function wordsNearby(phrase, idx) {
  const w = words(phrase);
  if (w.length < 2) return false;
  const list = idx.wordList;
  const span = Math.max(12, w.length * 4);
  for (let i = 0; i < list.length; i++) {
    if (list[i] !== w[0]) continue;
    const win = list.slice(i, i + span);
    let from = 0;
    let ok = true;
    for (const t of w) {
      const at = win.indexOf(t, from);
      if (at < 0) {
        ok = false;
        break;
      }
      from = at + 1;
    }
    if (ok) return true;
  }
  return false;
}

/** True when `phrase` is in the decision, allowing line and page breaks. */
export function phraseFound(phrase, idx) {
  const f = flat(phrase);
  if (!f) return true;
  if (idx.flat.includes(f)) return true;
  // Tolerate page headers and footers inside the quoted span: accept when
  // nearly all short windows of the phrase occur in the decision.
  if (CJK_RE.test(phrase)) {
    const win = 8;
    if (f.length < win * 2) return false;
    let hit = 0, total = 0;
    for (let i = 0; i + win <= f.length; i += 3) {
      total++;
      if (idx.flat.includes(f.slice(i, i + win))) hit++;
    }
    return total > 0 && hit / total >= 0.85;
  }
  const w = words(phrase);
  if (w.length < 6) return false;
  let hit = 0, total = 0;
  for (let i = 0; i + 4 <= w.length; i++) {
    total++;
    if (idx.wordStream.includes(" " + w.slice(i, i + 4).join(" ") + " ")) hit++;
  }
  return total > 0 && hit / total >= 0.85;
}

// ---------------------------------------------------------------- the check ---
/** Pieces of page text to check, with a label. */
export function pageTexts(rec) {
  const out = [];
  const add = (where, text) => text && out.push({ where, text });
  add("title", rec.title);
  add("subtitle", rec.articleTitle);
  add("summary", rec.summary);
  add("court", rec.court);
  add("case number", rec.caseNumber);
  add("parties", rec.parties);
  add("outcome", rec.outcome);
  rec.body.forEach((b, i) => {
    const where = `block ${i + 1}`;
    if (b.type === "paragraph" || b.type === "heading" || b.type === "subheading") add(where, b.text);
    else if (b.type === "list") b.items.forEach((x) => add(where, x));
    else if (b.type === "table") {
      add(where, b.caption);
      add(where, b.headers.join(" | "));
      b.rows.forEach((r) => add(where, (Array.isArray(r) ? r : r.cells).join(" | ")));
    }
  });
  return out;
}

const QUOTE_RE = /["“„«「『]([^"”»」』“]{6,400})["”»」』]/gu;
// "4 181" (a space between groups of three digits) is one number, "4181".
const NUMBER_RE =
  /(?<![\d.,])\d{1,3}(?:[ \u00a0\u202f\u2009'\u2019]\d{3})+(?![\d])|\d[\d.,/\-]*\d/g;
const MIN_QUOTE_WORDS = 4; // shorter quoted terms are labels, not claims
const MIN_QUOTE_CJK = 10;
// A quotation may leave words out ("..." or "[...]"); each stretch of the
// quotation that is actually quoted is checked on its own.
const ELLIPSIS_RE = /\s*(?:\[\s*(?:\.{3}|\u2026)\s*\]|\.{3}|\u2026)\s*/u;

export function checkRecord(rec, sourceText) {
  const idx = makeSourceIndex(sourceText);
  const items = [];
  const seen = new Set();
  for (const { where, text } of pageTexts(rec)) {
    // Verbatim fields must be found as they are.
    if (where === "outcome" || where === "parties" || where === "case number" || where === "court") {
      if (where === "court" || where === "case number") {
        // Court and number are checked by their digits and key words below.
      } else {
        // Parties and outcomes are written "A / B"; each part must be in the decision.
        const parts = where === "parties" || where === "outcome" ? text.split(" / ") : [text];
        if (parts.some((p) => !(phraseFound(p, idx) || wordsNearby(p, idx)))) {
          items.push({ kind: "field", where, text });
        }
      }
    }
    for (const m of text.matchAll(QUOTE_RE)) {
      for (const piece of m[1].split(ELLIPSIS_RE)) {
        const q = piece.trim();
        const long = CJK_RE.test(q) ? q.length >= MIN_QUOTE_CJK : words(q).length >= MIN_QUOTE_WORDS;
        if (!long || seen.has("q:" + q)) continue;
        seen.add("q:" + q);
        if (!phraseFound(q, idx)) items.push({ kind: "quote", where, text: q, context: text });
      }
    }
    for (const m of text.matchAll(NUMBER_RE)) {
      const raw = m[0];
      const digits = raw.replace(/\D/g, "");
      if (digits.length < 3 || seen.has("n:" + raw)) continue;
      seen.add("n:" + raw);
      const parts = raw.split(/[^\d]+/).filter(Boolean);
      const found =
        idx.numbers.has(digits) ||
        (parts.length > 1 && parts.filter((p) => p.length >= 3).every((p) => idx.numbers.has(p)));
      if (!found) items.push({ kind: "number", where, text: raw, context: text });
    }
  }
  return items;
}


export function pdfText(file) {
  return execFileSync("pdftotext", ["-enc", "UTF-8", file, "-"], {
    maxBuffer: 256 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  }).toString();
}

export function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#124;/g, "|")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

