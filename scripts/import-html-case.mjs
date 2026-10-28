// Importer: a case written as HTML (one Google Doc per case) -> the case's content blocks.
//
//   node scripts/import-html-case.mjs --slug <case-slug> --doc <Google Doc id or link | local file> [--write] [--out file.json]
//
// - The Google Docs text export escapes the HTML with backslashes (\<p\>): they are removed first.
// - Headings: the heading levels found are ranked: the highest level (h1 alone is the page
//   title and goes to the subtitle) becomes "heading", the levels below it "subheading".
// - Paragraphs, lists and tables become blocks. Links (<a href>), <em>/<i> and <strong>/<b> are
//   kept inside the text as <a href="...">, <em>, <strong>; links are kept only if they go to
//   an allowed host (src/lib/inline-core.mjs). Every other tag is dropped, its text kept.
// - The case's other fields (title, court, summary, ...) stay as they are in content/cases/<slug>.json.
// Without --write nothing is saved: the report says what would change.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse, HTMLElement, TextNode } from "node-html-parser";
import { encodeText, linksIn, plainText, safeHref } from "../src/lib/inline-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** Remove the backslashes Google Docs puts in front of punctuation. */
export function unescapeDoc(text) {
  return text
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\\([<>[\]()_*#`~|\\!+.=&"'{}-])/g, "$1");
}

const IGNORE = new Set(["style", "script", "head", "meta", "title", "hr", "link", "noscript"]);
const LOOSE_BLOCK = new Set(["div", "section", "article", "main", "body", "html", "header", "footer", "center", "figure", "nav", "aside"]);
const INLINE_PASS = new Set(["span", "font", "u", "mark", "sup", "sub", "code", "small", "big", "s", "strike", "del", "ins", "abbr", "cite", "q", "kbd", "var", "samp", "time", "label"]);

export function htmlToBlocks(html) {
  const report = { tags: {}, droppedTags: {}, droppedLinks: [], looseText: [], warnings: [], headingLevels: {} };
  const count = (o, k) => (o[k] = (o[k] ?? 0) + 1);

  const inline = (node) => inlineNodes(node.childNodes);
  const inlineNodes = (nodes) => {
    let out = "";
    for (const ch of nodes) {
      if (ch instanceof TextNode) {
        out += encodeText(ch.text);
        continue;
      }
      if (!(ch instanceof HTMLElement)) continue;
      const tag = ch.tagName.toLowerCase();
      count(report.tags, tag);
      if (tag === "br") out += " ";
      else if (tag === "a") {
        const href = ch.getAttribute("href");
        const inner = inline(ch);
        const safe = href ? safeHref(href) : null;
        if (safe && inner.trim()) out += `<a href="${safe.replace(/"/g, "%22")}">${inner}</a>`;
        else {
          if (href) report.droppedLinks.push(href);
          out += inner;
        }
      } else if (tag === "em" || tag === "i") {
        const inner = inline(ch);
        out += inner.trim() ? `<em>${inner}</em>` : inner;
      } else if (tag === "strong" || tag === "b") {
        const inner = inline(ch);
        out += inner.trim() ? `<strong>${inner}</strong>` : inner;
      } else if (IGNORE.has(tag)) {
        count(report.droppedTags, tag);
      } else {
        if (!INLINE_PASS.has(tag)) count(report.droppedTags, tag);
        out += inline(ch);
      }
    }
    return out;
  };
  const tidy = (s) =>
    s
      .replace(/\s+/g, " ")
      .replace(/<(em|strong)>\s*<\/\1>/g, "")
      .replace(/<\/(em|strong)>\s*<\1>/g, " ")
      .trim();

  const blocks = [];
  const headings = []; // { index, level }
  const pushParagraph = (s) => {
    const t = tidy(s);
    if (t) blocks.push({ type: "paragraph", text: t });
  };

  const walk = (node) => {
    let loose = "";
    const flush = () => {
      if (loose.trim()) {
        report.looseText.push(plainText(tidy(loose)).slice(0, 80));
        pushParagraph(loose);
      }
      loose = "";
    };
    for (const ch of node.childNodes) {
      if (ch instanceof TextNode) {
        if (ch.text.trim()) loose += encodeText(ch.text);
        continue;
      }
      if (!(ch instanceof HTMLElement)) continue;
      const tag = ch.tagName.toLowerCase();
      if (IGNORE.has(tag)) {
        count(report.droppedTags, tag);
        continue;
      }
      count(report.tags, tag);
      if (/^h[1-6]$/.test(tag)) {
        flush();
        const level = Number(tag[1]);
        const text = plainText(tidy(inline(ch)));
        if (!text) continue;
        count(report.headingLevels, tag);
        headings.push({ index: blocks.length, level });
        blocks.push({ type: "heading", text });
      } else if (tag === "p") {
        flush();
        pushParagraph(inline(ch));
      } else if (tag === "ul" || tag === "ol") {
        flush();
        const items = [];
        const collect = (list) => {
          for (const li of list.childNodes) {
            if (!(li instanceof HTMLElement) || li.tagName.toLowerCase() !== "li") continue;
            count(report.tags, "li");
            // text of the item without nested lists, then the nested items
            const nested = li.querySelectorAll("ul, ol");
            const t = tidy(inlineNodes(li.childNodes.filter((c) => !(c instanceof HTMLElement && /^(ul|ol)$/i.test(c.tagName)))));
            if (t) items.push(t);
            if (nested.length) report.warnings.push("a nested list was flattened into the list");
            for (const n of nested) if (n.parentNode === li) collect(n);
          }
        };
        collect(ch);
        if (items.length) blocks.push({ type: "list", items });
      } else if (tag === "table") {
        flush();
        const caption = ch.querySelector("caption");
        const trs = ch.querySelectorAll("tr");
        const rows = trs.map((tr) => tr.childNodes.filter((c) => c instanceof HTMLElement && /^(td|th)$/i.test(c.tagName)));
        for (const r of rows)
          for (const c of r) {
            count(report.tags, c.tagName.toLowerCase());
            if (c.getAttribute("rowspan") || c.getAttribute("colspan")) report.warnings.push("a table cell spans rows or columns; it was read as one cell");
          }
        count(report.tags, "tr");
        if (!rows.length) continue;
        const firstIsHead = rows[0].every((c) => c.tagName.toLowerCase() === "th") || !!ch.querySelector("thead");
        const headRow = firstIsHead ? rows[0] : null;
        const bodyRows = firstIsHead ? rows.slice(1) : rows;
        const cell = (c) => tidy(inline(c));
        const headers = headRow ? headRow.map((c) => plainText(cell(c))) : bodyRows[0].map((_, i) => `Column ${i + 1}`);
        if (!headRow) report.warnings.push("a table has no header row; generic column titles were used");
        const block = { type: "table", headers, rows: bodyRows.map((r) => ({ cells: r.map(cell) })) };
        if (caption) block.caption = plainText(tidy(inline(caption)));
        blocks.push(block);
      } else if (tag === "blockquote") {
        flush();
        const before = blocks.length;
        walk(ch);
        if (blocks.length === before) pushParagraph(inline(ch));
      } else if (tag === "pre") {
        flush();
        pushParagraph(encodeText(ch.text));
      } else if (tag === "img" || tag === "iframe" || tag === "svg" || tag === "video") {
        count(report.droppedTags, tag);
      } else if (LOOSE_BLOCK.has(tag)) {
        flush();
        walk(ch);
      } else if (tag === "a" || tag === "em" || tag === "i" || tag === "strong" || tag === "b" || INLINE_PASS.has(tag) || tag === "br") {
        // inline element at block level: part of a loose paragraph
        loose += inlineNodes([ch]);
      } else {
        count(report.droppedTags, tag);
        flush();
        walk(ch);
      }
    }
    flush();
  };

  const root = parse(html, { blockTextElements: { script: false, style: false, pre: true } });
  walk(root);

  // rank the heading levels: h1 alone = page title; the rest map to heading / subheading
  let articleTitle = null;
  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 1 && headings.some((h) => h.level > 1)) {
    articleTitle = blocks[h1s[0].index].text;
    blocks[h1s[0].index] = null;
  }
  const levels = [...new Set(headings.filter((h) => !(articleTitle && h.level === 1)).map((h) => h.level))].sort((a, b) => a - b);
  for (const h of headings) {
    const b = blocks[h.index];
    if (!b) continue;
    b.type = levels.indexOf(h.level) === 0 ? "heading" : "subheading";
  }
  return { blocks: blocks.filter(Boolean), articleTitle, report };
}

export async function loadDoc(doc) {
  if (fs.existsSync(doc)) return fs.readFileSync(doc, "utf8");
  const id = (doc.match(/\/d\/([A-Za-z0-9_-]+)/) ?? [null, doc])[1];
  if (!/^[A-Za-z0-9_-]{20,}$/.test(id)) throw new Error(`not a file or a Google Doc id: ${doc}`);
  const res = await fetch(`https://docs.google.com/document/d/${id}/export?format=txt`, { redirect: "follow" });
  if (!res.ok) throw new Error(`the document could not be fetched (${res.status}); is it shared with "anyone with the link"?`);
  return res.text();
}

const words = (s) => s.split(/\s+/).filter(Boolean).length;
export function describe(blocks) {
  const types = {};
  let w = 0;
  const links = [];
  for (const b of blocks) {
    types[b.type] = (types[b.type] ?? 0) + 1;
    const texts = b.type === "list" ? b.items : b.type === "table" ? [...b.headers, ...b.rows.flatMap((r) => (Array.isArray(r) ? r : r.cells))] : [b.text];
    for (const t of texts) {
      w += words(plainText(t));
      links.push(...linksIn(t));
    }
  }
  return { types, words: w, links };
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  const slug = opt("--slug");
  const doc = opt("--doc");
  if (!slug || !doc) {
    console.error("Usage: node scripts/import-html-case.mjs --slug <case-slug> --doc <Google Doc id | link | file> [--write] [--out file.json]");
    process.exit(1);
  }
  const file = path.join(ROOT, "content", "cases", `${slug}.json`);
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  if (!existing) {
    console.error(`There is no content/cases/${slug}.json: create the case first (metadata), then import its text.`);
    process.exit(1);
  }
  const raw = await loadDoc(doc);
  const text = unescapeDoc(raw);
  const { blocks, articleTitle, report } = htmlToBlocks(text);
  if (!blocks.length) {
    console.error("No content blocks were found: is this an HTML document?");
    process.exit(1);
  }
  const now = describe(blocks);
  const before = describe(existing.body);
  const hosts = {};
  for (const l of now.links) hosts[new URL(l.href, "https://rdtaxcases.com").host] = (hosts[new URL(l.href, "https://rdtaxcases.com").host] ?? 0) + 1;

  console.log(`Case: ${slug}`);
  console.log(`Document: ${doc.length > 40 ? doc.slice(0, 30) + "..." : doc} (${text.length} characters, ${words(text)} words as exported)`);
  console.log(`Tags read: ${JSON.stringify(report.tags)}`);
  console.log(`Tags dropped (text kept): ${JSON.stringify(report.droppedTags)}`);
  console.log(`Heading levels in the document: ${JSON.stringify(report.headingLevels)}`);
  console.log(`Blocks now: ${JSON.stringify(now.types)}, ${now.words} words`);
  console.log(`Blocks before (in the case file): ${JSON.stringify(before.types)}, ${before.words} words`);
  console.log(`Links kept: ${now.links.length} (${JSON.stringify(hosts)}), ${new Set(now.links.map((l) => l.href)).size} distinct`);
  console.log(`Links dropped (not an allowed address): ${report.droppedLinks.length}${report.droppedLinks.length ? " e.g. " + report.droppedLinks.slice(0, 3).join(" ") : ""}`);
  if (report.looseText.length) console.log(`Text outside any tag, made into paragraphs: ${report.looseText.length} e.g. "${report.looseText[0]}"`);
  for (const w of new Set(report.warnings)) console.log(`Note: ${w}`);
  if (articleTitle) console.log(`Page title (h1) found: "${articleTitle.slice(0, 100)}"${existing.articleTitle ? " (the case's subtitle is kept)" : " (set as the subtitle)"}`);

  const next = { ...existing, body: blocks };
  if (articleTitle && !existing.articleTitle) next.articleTitle = articleTitle;
  const out = JSON.stringify(next, null, 2) + "\n";
  if (opt("--out")) {
    fs.writeFileSync(opt("--out"), out);
    console.log(`Written to ${opt("--out")}`);
  } else if (args.includes("--write")) {
    fs.writeFileSync(file, out);
    console.log(`Written to content/cases/${slug}.json`);
  } else console.log("Nothing saved (add --write to save).");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
