// Tests for the inline markup and the HTML importer. Run by `npm run check`.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inlineProblems, linksIn, parseInline, plainText, safeHref, hasMarkup } from "../src/lib/inline-core.mjs";
import { htmlToBlocks, unescapeDoc } from "./import-html-case.mjs";
import { dropRepeatedNumber } from "../src/lib/list-label.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
};

// ---- links: only swansonreed.com and rdtaxcases.com
ok("allowed hosts", () => {
  assert.equal(safeHref("https://www.swansonreed.com/a/b/"), "https://www.swansonreed.com/a/b/");
  assert.equal(safeHref("https://swansonreed.com/x"), "https://swansonreed.com/x");
  assert.equal(safeHref("https://rdtaxcases.com/cases/a"), "https://rdtaxcases.com/cases/a");
  assert.equal(safeHref("/cases/a"), "/cases/a");
});
ok("refused links", () => {
  for (const bad of [
    "https://example.com/",
    "http://www.swansonreed.com/",
    "//evil.com/x",
    "javascript:alert(1)",
    "https://swansonreed.com.evil.com/",
    "https://evil.com/swansonreed.com",
    "https://user:pw@swansonreed.com/",
    "mailto:a@swansonreed.com",
    "",
  ]) assert.equal(safeHref(bad), null, bad);
});

// ---- parsing
ok("em/strong/a", () => {
  const { nodes, problems } = parseInline('A <em>b</em> <strong>c</strong> <a href="https://www.swansonreed.com/x">d</a>.');
  assert.deepEqual(problems, []);
  assert.equal(nodes.map((x) => x.t).join(","), "text,em,text,strong,text,a,text");
  assert.equal(nodes[5].external, true);
});
ok("own-site link is not external", () => {
  assert.equal(parseInline('<a href="/cases/x">x</a>').nodes[0].external, false);
  assert.equal(parseInline('<a href="https://rdtaxcases.com/cases/x">x</a>').nodes[0].external, false);
});
ok("a refused link shows its text only and is reported", () => {
  const { nodes, problems } = parseInline('see <a href="https://example.com/">here</a> now');
  assert.equal(nodes.every((x) => x.t === "text"), true);
  assert.equal(plainText('see <a href="https://example.com/">here</a> now'), "see here now");
  assert.equal(problems.length, 1);
});
ok("other tags and attributes are refused", () => {
  assert.ok(inlineProblems("<script>x</script>").length > 0);
  assert.ok(inlineProblems('<a href="https://www.swansonreed.com/" onclick="x()">t</a>').length > 0);
  assert.ok(inlineProblems('<img src="x">').length > 0);
  assert.deepEqual(inlineProblems('<a href="https://www.swansonreed.com/" target="_blank" rel="noopener">t</a>'), []);
});
ok("unbalanced tags are reported", () => {
  assert.ok(inlineProblems("<em>never closed").length > 0);
  assert.ok(inlineProblems("closed</strong> never opened").length > 0);
});
ok("plain text with signs is untouched", () => {
  for (const t of ["R&D credit", "at *77 (2009)", "5 < 6 and 7 > 3", "[2019] FCAFC 120", "a <1% share", "x<y"]) assert.equal(plainText(t), t, t);
  assert.deepEqual(inlineProblems("5 < 6 and 7 > 3"), []);
  assert.equal(plainText("less than 5 &lt; 6 &amp; more"), "less than 5 < 6 & more");
});
ok("links are listed", () => {
  const l = linksIn('<a href="https://www.swansonreed.com/a/">A</a> and <em><a href="/cases/b">B</a></em>');
  assert.deepEqual(l.map((x) => [x.href, x.text]), [["https://www.swansonreed.com/a/", "A"], ["/cases/b", "B"]]);
});
ok("hasMarkup", () => {
  assert.equal(hasMarkup("a <em>b</em>"), true);
  assert.equal(hasMarkup("R&D <5"), false);
});

// ---- existing case text has no markup, so nothing changes for existing cases
ok("existing cases: no markup and unchanged plain text", () => {
  const dir = path.join(__dirname, "..", "content", "cases");
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const c = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const texts = c.body.flatMap((b) => (b.type === "list" ? b.items : b.type === "table" ? b.rows.flatMap((r) => (Array.isArray(r) ? r : r.cells)) : [b.text]));
    for (const t of texts) {
      assert.equal(inlineProblems(t).length, 0, `${f}: ${t.slice(0, 60)}`);
      assert.equal(plainText(t), t, `${f}: ${t.slice(0, 60)}`);
    }
  }
});

// ---- the importer on the fixture (escaped HTML as Google Docs exports it)
const fixture = fs.readFileSync(path.join(__dirname, "fixtures", "html-case-sample.txt"), "utf8");
ok("unescape", () => {
  const u = unescapeDoc(fixture);
  assert.ok(u.includes('<h4>Executive Summary and Case Background</h4>'));
  assert.ok(u.includes('href="https://www.swansonreed.com/research-tax-credit/glossary/funded-research-exclusion/"'));
  assert.ok(!u.includes("\\"));
});
const { blocks, report } = htmlToBlocks(unescapeDoc(fixture));
ok("blocks", () => {
  assert.deepEqual(blocks.map((b) => b.type), ["heading", "paragraph", "paragraph", "heading", "paragraph", "list", "heading", "table"]);
  assert.equal(blocks[0].text, "Executive Summary and Case Background");
  assert.equal(blocks[3].text, "The Court's Reasoning");
  assert.equal(blocks[5].items.length, 2);
  assert.deepEqual(blocks[7].headers, ["Requirement", "Holding"]);
  assert.equal(blocks[7].rows.length, 2);
});
ok("links and emphasis survive, others are dropped", () => {
  assert.ok(blocks[1].text.includes('<a href="https://www.swansonreed.com/research-tax-credit/glossary/funded-research-exclusion/">funded research exclusion</a>'));
  assert.ok(!blocks[1].text.includes("target"));
  assert.ok(blocks[2].text.includes("<em>Robertson v. United States</em>"));
  assert.ok(blocks[2].text.includes("<strong>consideration</strong>"));
  assert.ok(!blocks[2].text.includes("example.com"));
  assert.ok(blocks[2].text.includes("outside article"));
  assert.deepEqual(report.droppedLinks, ["https://example.com/not-allowed"]);
  assert.ok(blocks[2].text.includes("R&D credit"));
  assert.ok(blocks[7].rows[0].cells[1].includes("5 &lt; 6"));
  assert.equal(plainText(blocks[7].rows[0].cells[1]), "The prize discharged an obligation (less than 5 < 6 pages).");
  assert.ok(blocks[7].rows[1].cells[0].includes('<a href="https://www.swansonreed.com/research-tax-credit/glossary/qualified-research/">qualified research</a>'));
  // every stored string passes the format rules
  for (const b of blocks) {
    const texts = b.type === "list" ? b.items : b.type === "table" ? b.rows.flatMap((r) => r.cells) : b.type === "paragraph" ? [b.text] : [];
    for (const t of texts) assert.deepEqual(inlineProblems(t), [], t);
  }
});
ok("h1 alone is the page title; levels are ranked", () => {
  const r = htmlToBlocks("<h1>Title</h1><h2>One</h2><p>a</p><h3>Two</h3><p>b</p><h4>Three</h4><p>c</p>");
  assert.equal(r.articleTitle, "Title");
  assert.deepEqual(r.blocks.map((b) => b.type), ["heading", "paragraph", "subheading", "paragraph", "subheading", "paragraph"]);
});
ok("wrappers, styles, spans and loose text", () => {
  const r = htmlToBlocks('<div class="x"><style>p{color:red}</style><p><span style="x">Hello</span> <b>world</b></p>loose line<br><img src="x.png"></div>');
  assert.deepEqual(r.blocks.map((b) => b.type), ["paragraph", "paragraph"]);
  assert.equal(r.blocks[0].text, "Hello <strong>world</strong>");
  assert.equal(r.blocks[1].text, "loose line");
});

// ---- the editor list does not show a case number twice
ok("list label", () => {
  assert.equal(dropRepeatedNumber("Kfv.V.35.196/2013/5., Kfv.V.35.196/2013/5."), "Kfv.V.35.196/2013/5.");
  assert.equal(dropRepeatedNumber("92/2026, 92/2026"), "92/2026");
  assert.equal(dropRepeatedNumber("Sundøya Fjordhotel Eiendom AS, LB-2007-54463 (UTV-2008-1196), LB-2007-54463"), "Sundøya Fjordhotel Eiendom AS, LB-2007-54463 (UTV-2008-1196)");
  assert.equal(dropRepeatedNumber("Amirikian v. United States, 197 F.2d 442"), "Amirikian v. United States, 197 F.2d 442");
  assert.equal(dropRepeatedNumber("Smith, Jones and Co v. Commissioner, T.C. Memo. 2001-66"), "Smith, Jones and Co v. Commissioner, T.C. Memo. 2001-66");
  assert.equal(dropRepeatedNumber("No comma here"), "No comma here");
  assert.equal(dropRepeatedNumber("Trailing, "), "Trailing, ");
});

console.log(`inline markup and importer: ${n} groups of tests passed`);
