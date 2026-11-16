// Clean the HTML of a delivered document before it is read into content blocks (scripts/import-html-case.mjs):
//   - the answer capsule (<section class="answer-capsule">) is found: its text is the page's summary;
//   - any h1 is removed (the page template writes the title);
//   - a "Works cited" / "References" / "Sources" section is removed (the site publishes no reference lists);
//   - footnote markers are removed: <sup>3</sup> and <sup>[3]</sup> after text in a document that has a references
//     section, and <sup>[3]</sup> anywhere. Superscripts of a formula (right after a <sub>) stay;
//   - MathML is turned into text (a fraction becomes "a / b") so numbers never run together.
import { parse, HTMLElement, TextNode } from "node-html-parser";

const REFERENCES = /^\s*(works cited|references|sources|bibliography)\s*$/i;
const decode = (s) =>
  s
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "’")
    .replace(/&sect;/g, "§")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));

const isEl = (n) => n instanceof HTMLElement;
const tag = (n) => (isEl(n) ? n.tagName.toLowerCase() : "");

function mathToText(m) {
  const t = tag(m);
  const kids = m.childNodes.filter((c) => isEl(c) || (c instanceof TextNode && c.text.trim()));
  if (t === "mfrac") {
    const [a, b] = kids.map((k) => (isEl(k) ? mathToText(k) : k.text.trim()));
    const wrap = (s) => (/[\s+\-×÷=]/.test(s) ? `(${s})` : s);
    return `${wrap(a ?? "")} / ${wrap(b ?? "")}`;
  }
  if (t === "msup") return kids.map((k) => (isEl(k) ? mathToText(k) : k.text.trim())).join("^");
  if (t === "msub") return kids.map((k) => (isEl(k) ? mathToText(k) : k.text.trim())).join("_");
  if (!isEl(m)) return m.text;
  return m.childNodes.map((c) => (isEl(c) ? mathToText(c) : c.text)).join(t === "mrow" || t === "math" ? " " : "").replace(/\s+/g, " ").trim();
}

/** @returns {{ html: string, capsule: string, h1: string[], report: object }} */
export function prepareDoc(html) {
  const root = parse(html, { blockTextElements: { script: false, style: false, pre: true } });
  const report = { removedReferences: 0, removedFootnoteMarkers: 0, removedH1: 0, mathReplaced: 0 };

  // the answer capsule
  let capsule = "";
  const cap = root.querySelector("section.answer-capsule");
  if (cap) capsule = decode(cap.text).replace(/\s+/g, " ").trim();

  // h1
  const h1 = [];
  for (const h of root.querySelectorAll("h1")) {
    h1.push(decode(h.text).replace(/\s+/g, " ").trim());
    h.remove();
    report.removedH1++;
  }

  // references sections
  let hadReferences = false;
  for (const h of root.querySelectorAll("h2, h3, h4, h5, h6")) {
    if (!h.parentNode || !REFERENCES.test(decode(h.text))) continue;
    hadReferences = true;
    report.removedReferences++;
    const level = Number(tag(h)[1]);
    const parent = h.parentNode;
    const first = parent.childNodes.find((c) => isEl(c));
    if (parent !== root && ["section", "footer", "div", "aside"].includes(tag(parent)) && first === h) {
      parent.remove();
    } else {
      // the heading and what follows it, up to the next heading of the same or a higher level
      const sibs = parent.childNodes;
      const at = sibs.indexOf(h);
      let end = sibs.length;
      for (let i = at + 1; i < sibs.length; i++) {
        const m = tag(sibs[i]).match(/^h([1-6])$/);
        if (m && Number(m[1]) <= level) {
          end = i;
          break;
        }
      }
      for (const n of sibs.slice(at, end)) n.remove();
    }
  }

  // footnote markers
  for (const sup of root.querySelectorAll("sup")) {
    const text = decode(sup.text).trim();
    const bracketed = /^\[\d{1,3}(\s*[,–-]\s*\d{1,3})*\]$/.test(text);
    const plain = /^\d{1,3}(\s*,\s*\d{1,3})*$/.test(text);
    if (!bracketed && !(plain && hadReferences)) continue;
    const parent = sup.parentNode;
    if (!parent) continue;
    const prev = parent.childNodes[parent.childNodes.indexOf(sup) - 1];
    if (prev && ["sub", "sup", "var"].includes(tag(prev))) continue; // an index in a formula
    sup.remove();
    report.removedFootnoteMarkers++;
  }

  // MathML
  for (const m of root.querySelectorAll("math")) {
    m.replaceWith(new TextNode(` ${mathToText(m)} `));
    report.mathReplaced++;
  }

  return { html: root.toString(), capsule, h1, report };
}
