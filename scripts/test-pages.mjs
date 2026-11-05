// Tests for the page importer (glossary terms, laws, FAQ questions): wrappers dropped, text and captions kept,
// h1 = title, dates from <time>, trailing slashes removed from internal links, ordered lists, addresses checked.
import assert from "node:assert/strict";
import { buildPage } from "./import-page.mjs";
import { normalizeInternalHref } from "../src/lib/inline-core.mjs";
import { loadSiteMap } from "./lib/page-address.mjs";
import { measure } from "./link-density.mjs";

const siteMap = loadSiteMap();
let groups = 0;
const group = (name, fn) => {
  fn();
  groups++;
};

const DOC = `<article lang="en-US" class="rd-tax-guide">
<header><h1>Funded research under Section 41</h1>
<p class="post-meta"><time datetime="2026-11-03">November 3, 2026</time> (verified and updated <time datetime="2026-11-04">November 4, 2026</time>)</p></header>
<section id="a" aria-label="A"><h2>First section</h2>
<p>See <a href="/us/glossary/funded-research/" target="_blank" rel="noopener" title="x">funded research</a> and <a href="/us/legislation/26-usc-41d4-rd-tax-credit-excluded-activities">the exclusions</a>, in <cite>Fairchild v. United States</cite>.</p>
<h3>A detail</h3>
<ol><li><strong>One.</strong> first</li><li>second</li></ol>
<ul><li>bullet</li></ul>
<figure><table><caption>Table 1. Costs</caption><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody><tr><td>Wages</td><td>$1</td></tr></tbody><tfoot><tr><th scope="row">Total</th><td>$1</td></tr></tfoot></table></figure>
</section></article>`;

group("a glossary page is read from its document", () => {
  const { page, kind } = buildPage({ address: "/us/glossary/funded-research", text: DOC, siteMap });
  assert.equal(kind, "glossary-term");
  assert.equal(page.title, "Funded research under Section 41");
  assert.equal(page.country, "us");
  assert.equal(page.language, "en-US");
  assert.equal(page.status, "preview");
  assert.equal(page.published, "2026-11-03");
  assert.equal(page.updated, "2026-11-04");
  // the dates line is not a paragraph (it is shown from the two dates); the h1 is the title, not a block
  assert.ok(!page.body.some((b) => b.type === "paragraph" && /November 3/.test(b.text)));
  assert.deepEqual(page.body.map((b) => b.type), ["heading", "paragraph", "subheading", "list", "list", "table"]);
  // no wrapper tags survive anywhere
  assert.ok(!/<(article|header|section|figure|time|cite)\b/.test(JSON.stringify(page.body)));
});

group("links: trailing slash removed, cite is emphasis, attributes dropped", () => {
  const { page } = buildPage({ address: "/us/glossary/funded-research", text: DOC, siteMap });
  const p = page.body[1].text;
  assert.ok(p.includes('<a href="/us/glossary/funded-research">funded research</a>'));
  assert.ok(!p.includes("target=") && !p.includes("title="));
  assert.ok(p.includes("<em>Fairchild v. United States</em>"));
  assert.equal(normalizeInternalHref("/us/glossary/x/"), "/us/glossary/x");
  assert.equal(normalizeInternalHref("/us/glossary/x/#a"), "/us/glossary/x#a");
  assert.equal(normalizeInternalHref("/"), "/");
  assert.equal(normalizeInternalHref("https://www.swansonreed.com/a/"), "https://www.swansonreed.com/a/");
});

group("lists and tables", () => {
  const { page } = buildPage({ address: "/us/glossary/funded-research", text: DOC, siteMap });
  assert.deepEqual(page.body[3], { type: "list", ordered: true, items: ["<strong>One.</strong> first", "second"] });
  assert.deepEqual(page.body[4], { type: "list", items: ["bullet"] });
  const t = page.body[5];
  assert.equal(t.caption, "Table 1. Costs");
  assert.deepEqual(t.headers, ["Item", "Amount"]);
  // the footer row stays, as the last row
  assert.deepEqual(t.rows.map((r) => r.cells), [["Wages", "$1"], ["Total", "$1"]]);
});

group("the address decides what is accepted", () => {
  assert.throws(() => buildPage({ address: "/us/glossary/funded-research/", text: DOC, siteMap }), /trailing slash/);
  assert.throws(() => buildPage({ address: "/us/amirikian-v-united-states", text: DOC, siteMap }), /glossary terms, laws and FAQ/);
  assert.throws(() => buildPage({ address: "/us/glossary", text: DOC, siteMap }), /glossary-hub/);
  assert.throws(() => buildPage({ address: "/us/glossary/x", text: "<p>no heading</p>", siteMap }), /h1/);
  assert.equal(buildPage({ address: "/us/legislation/26-usc-41a-rd-tax-credit-general-rule", text: DOC, siteMap }).kind, "legislation-page");
  assert.equal(buildPage({ address: "/us/faq/some-question", text: DOC, siteMap }).kind, "faq-question");
});

group("link density", () => {
  const { page } = buildPage({ address: "/us/glossary/funded-research", text: DOC, siteMap });
  const m = measure("/us/glossary/funded-research", page.body);
  assert.equal(m.links, 2);
  assert.equal(m.distinct, 2);
  assert.equal(m.repeats, 0);
  const rep = measure("/x", [{ type: "paragraph", text: 'one <a href="/a">a</a> two <a href="/a">a</a> three <a href="/b">b</a>' }]);
  assert.equal(rep.links, 3);
  assert.equal(rep.distinct, 2);
  assert.equal(rep.repeats, 1);
  assert.equal(rep.maxRepeat, 2);
});

console.log(`pages and link density: ${groups} groups of tests passed`);
