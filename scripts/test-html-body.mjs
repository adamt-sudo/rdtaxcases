// Tests for the HTML body field of the editor (scripts/lib/html-body.mjs): the same cleaning and link rules as the importer,
// the answer capsule as summary and meta description, and plain-English problems for a broken paste.
import assert from "node:assert/strict";
import { hasHtmlBody, htmlProblems, resolveHtmlBody } from "./lib/html-body.mjs";
import { linksIn, plainText } from "../src/lib/inline-core.mjs";

let groups = 0;
const group = (name, fn) => {
  fn();
  groups++;
};

const CAPSULE = "SR&amp;ED refund timing in Canada depends on the claim. A second sentence follows.";
const DOC = `<style>p{color:red}</style><script>alert(1)</script>
<article lang="en-CA"><h1>Refund timing in Canada</h1>
<section class="answer-capsule" aria-label="Summary"><p>${CAPSULE}</p></section>
<h2>First section</h2>
<p>See <a href="https://rdtaxcases.com/ca/glossary/sred/" target="_blank" rel="noopener">SR&amp;ED</a>, <a href="https://rdtaxcases.com/ca/glossary/never-written-page/">a page not written yet</a>,
<a href="https://www.canada.ca/en/x.html">the CRA</a> and again <a href="https://www.canada.ca/en/x.html">the CRA</a>.<sup>[3]</sup></p>
<ul><li>one</li><li>two</li></ul>
<h2>References</h2><p>Some source, 2020.</p>
</article>`;

group("the document is cleaned like the importer does it", () => {
  const { record, problems } = resolveHtmlBody({ title: "T", htmlBody: DOC }, "page");
  assert.deepEqual(problems, []);
  assert.equal(record.htmlBody, undefined);
  const text = JSON.stringify(record.body);
  assert.ok(!/alert|color:red|Refund timing in Canada"|Some source|\[3\]/.test(text), text);
  assert.ok(record.body.some((b) => b.type === "heading" && b.text === "First section"));
  assert.ok(record.body.some((b) => b.type === "list" && b.items.length === 2));
});

group("links follow the link rules", () => {
  const { record } = resolveHtmlBody({ title: "T", htmlBody: DOC }, "page");
  const para = record.body.find((b) => b.type === "paragraph" && /See /.test(b.text));
  const links = linksIn(para.text).map((l) => l.href);
  // this site: a path without a trailing slash (the renderer writes https://rdtaxcases.com/... and opens it in a new tab)
  assert.ok(links.includes("/ca/glossary/sred"), links.join());
  assert.ok(links.includes("/ca/glossary/never-written-page"), links.join());
  // an outside address is linked once per page
  assert.equal(links.filter((h) => h === "https://www.canada.ca/en/x.html").length, 1);
  assert.ok(!/target=|rel=/.test(para.text));
});

group("the answer capsule is the summary and the meta description", () => {
  const page = resolveHtmlBody({ title: "T", htmlBody: DOC }, "page").record;
  assert.equal(page.summary, "SR&ED refund timing in Canada depends on the claim. A second sentence follows.");
  assert.equal(page.description, "SR&ED refund timing in Canada depends on the claim. A second sentence follows.");
  // the meta description field wins when it is filled
  const own = resolveHtmlBody({ title: "T", description: "My own.", htmlBody: DOC }, "page").record;
  assert.equal(own.description, "My own.");
  // a case: its field is metaDescription, and the capsule is not repeated as the first paragraph of the text
  const c = resolveHtmlBody({ title: "T", htmlBody: DOC }, "case").record;
  assert.ok(c.metaDescription.startsWith("SR&ED refund timing"));
  assert.ok(!plainText(c.body[0].text ?? "").includes("A second sentence follows"));
  // a page keeps it
  assert.ok(page.body.some((b) => b.type === "paragraph" && b.text.includes("A second sentence follows")));
});

group("what is missing is said in plain English", () => {
  const noCapsule = "<h2>A</h2><p>Text without a capsule.</p>";
  let r = resolveHtmlBody({ title: "T", htmlBody: noCapsule }, "page");
  assert.ok(r.problems.some((p) => /meta description is empty/.test(p)), r.problems.join("|"));
  r = resolveHtmlBody({ title: "T", description: "Described.", htmlBody: noCapsule }, "page");
  assert.deepEqual(r.problems, []);
  r = resolveHtmlBody({ title: "T", kind: "faq-question", description: "Described.", htmlBody: noCapsule }, "page");
  assert.ok(r.problems.some((p) => /no short summary/.test(p)), r.problems.join("|"));
  r = resolveHtmlBody({ title: "T", description: "x".repeat(156), htmlBody: noCapsule }, "page");
  assert.ok(r.problems.some((p) => /156 characters/.test(p)));
});

group("a broken paste is refused", () => {
  assert.ok(htmlProblems("<div><p>cut off in the middle").some((p) => /<div> is opened 1 time\(s\) and closed 0/.test(p)));
  assert.ok(htmlProblems("&lt;p&gt;shown as text&lt;/p&gt;").some((p) => /shown as text/.test(p)));
  assert.ok(htmlProblems("just words").some((p) => /no HTML tags/.test(p)));
  assert.deepEqual(htmlProblems(DOC), []);
  const r = resolveHtmlBody({ title: "T", description: "d", htmlBody: "<script>x()</script><img src=a>" }, "page");
  assert.ok(r.problems.some((p) => /no text that could be read/.test(p)), r.problems.join("|"));
});

group("a record without an HTML body is left alone", () => {
  const rec = { title: "T", body: [{ type: "paragraph", text: "x" }] };
  assert.equal(hasHtmlBody(rec), false);
  assert.equal(hasHtmlBody({ htmlBody: "   " }), false);
  assert.equal(resolveHtmlBody(rec, "page").record, rec);
});

console.log(`HTML body field: ${groups} groups of tests passed`);
