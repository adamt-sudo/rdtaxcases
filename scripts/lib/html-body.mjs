// The "HTML body" field of the editor: HTML pasted from a Google Doc becomes the page's text at build time, through the same
// pipeline as the importer (scripts/import-batch.mjs):
//   - the cleaning of scripts/lib/doc-clean.mjs (h1, "Works cited" / "References" sections, footnote markers, MathML) and the
//     reading of scripts/import-html-case.mjs (scripts, styles, head, images and every other tag are dropped, its text kept);
//   - the link rules: links to this site are paths without a trailing slash (the renderer writes https://rdtaxcases.com/...
//     and opens them in a new tab with rel="noopener"), content/link-rules.json, each outside address linked once per page;
//     a link to a page that does not exist yet is shown as plain text and listed in content/pending-pages.json;
//   - the answer capsule (<section class="answer-capsule">) is the summary, and the meta description when that field is empty
//     (the first sentence, at most 155 characters).
// Used by the index builders (what the site is built from), the pull-request check and the pending list.
import { htmlToBlocks, unescapeDoc } from "../import-html-case.mjs";
import { prepareDoc } from "./doc-clean.mjs";
import { makeDescription } from "./describe.mjs";
import { applyLinkRules, dedupeExternalLinks } from "./legacy-links.mjs";
import { plainText } from "../../src/lib/inline-core.mjs";

/** One document (the text of a Google Doc export or pasted HTML) -> content blocks. */
export function convertDoc(text) {
  const prep = prepareDoc(unescapeDoc(text));
  const { blocks, report } = htmlToBlocks(prep.html);
  return { blocks, capsule: prep.capsule, h1: prep.h1, report: { ...report, ...prep.report } };
}

/** The editor's names for the fields, for messages written for the person who filled them in. */
export const FIELD_LABELS = {
  title: "Title",
  slug: "Slug",
  caseNumber: "Case number",
  court: "Court",
  year: "Year",
  subject: "Subject",
  summary: "Summary",
  metaDescription: "Meta description",
  description: "Meta description",
  htmlBody: "HTML body",
  body: "Text blocks",
};

export const hasHtmlBody = (rec) => typeof rec?.htmlBody === "string" && rec.htmlBody.trim() !== "";

// tags whose opening and closing tags must match in a complete document
const PAIRED = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "table", "a", "strong", "em", "b", "i", "div", "section", "blockquote"];

/** Plain-English problems of a pasted HTML text (it is cut off, was pasted as text, or has nothing to read). */
export function htmlProblems(html) {
  const out = [];
  const src = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "");
  const tags = (src.match(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi) ?? []).length;
  if (!tags) {
    out.push(
      /&lt;\/?[a-z]/i.test(src) || /\\<\/?[a-z]/i.test(src)
        ? 'The HTML body looks like HTML shown as text (it contains "&lt;p&gt;"). Copy the HTML code of the document, not the page as it looks.'
        : "The HTML body has no HTML tags (no <p>, <h2>, <ul>...). Paste the document's HTML code.",
    );
    return out;
  }
  for (const t of PAIRED) {
    const opens = (src.match(new RegExp(`<${t}(?=[\\s>/])`, "gi")) ?? []).length;
    const closes = (src.match(new RegExp(`</${t}\\s*>`, "gi")) ?? []).length;
    if (opens !== closes) out.push(`The HTML is broken: <${t}> is opened ${opens} time(s) and closed ${closes} time(s). The paste may be cut off: copy the whole document again.`);
  }
  return out;
}

/**
 * Turn the HTML body of a record into its text. `kind` is "case" or "page" (a glossary term, FAQ question or law).
 * Returns { record, problems }: the record without htmlBody, with body, summary and the meta description filled in (what the
 * editor left empty), and the problems in plain English. A record without an HTML body is returned as it is.
 */
export function resolveHtmlBody(rec, kind) {
  if (!hasHtmlBody(rec)) return { record: rec, problems: [] };
  const problems = [...htmlProblems(rec.htmlBody)];
  const { htmlBody, ...rest } = rec;
  const { blocks, capsule, report } = convertDoc(htmlBody);
  if (!blocks.length && !problems.length) problems.push("The HTML body has no text that could be read (only tags, images or scripts).");
  dedupeExternalLinks(blocks);
  applyLinkRules(blocks);
  // the capsule is the summary: for a case it is not repeated as the first paragraph of the text (as the importer does)
  const body = kind === "case" && blocks[0]?.type === "paragraph" && capsule && plainText(blocks[0].text).replace(/\s+/g, " ").trim() === capsule ? blocks.slice(1) : blocks;
  const descField = kind === "case" ? "metaDescription" : "description";
  const own = typeof rest[descField] === "string" ? rest[descField].trim() : "";
  const description = own || makeDescription(capsule, 155, rest.title ?? "").text;
  const summary = typeof rest.summary === "string" && rest.summary.trim() ? rest.summary : capsule;
  if (!description) problems.push(`The meta description is empty and the HTML has no answer capsule (<section class="answer-capsule">) to make one from. Fill in the "Meta description" field.`);
  if (own.length > 155) problems.push(`The meta description is ${own.length} characters. At most 155.`);
  if (!summary && (kind === "case" || rest.kind === "faq-question")) {
    problems.push(`There is no short summary: add an answer capsule (<section class="answer-capsule">) to the HTML, or fill in the "Summary" field.`);
  }
  const record = { ...rest, body, ...(summary ? { summary } : {}), ...(description ? { [descField]: description } : {}) };
  return { record, problems, report };
}
