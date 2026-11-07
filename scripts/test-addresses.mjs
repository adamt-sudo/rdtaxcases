// Tests for the address rules and the delivery sheet checks. Run by `npm run check`.
import assert from "node:assert/strict";
import { loadSiteMap, parseAddress } from "./lib/page-address.mjs";
import { checkLinks, parseCsv, readDelivery, validateRows } from "./import-delivery.mjs";

const map = loadSiteMap();
let n = 0;
const ok = (fn) => {
  fn();
  n++;
};

ok(() => {
  assert.equal(Object.keys(map.countries).length, 54, "the sitemap has the USA and 53 countries (Australia and the United Arab Emirates added)");
  assert.equal(map.countries.au.hreflang, "en-AU");
  assert.equal(map.countries.rs.htmlLang, "sr-Cyrl-RS");
  assert.equal(map.countries.it.folders.faq, "domande-frequenti");
  assert.equal(map.countries.tn.dir, "rtl");
  // United Arab Emirates: Arabic, right to left, section folders in Latin letters (the owner's final sheet)
  assert.deepEqual(map.countries.ae, { hreflang: "ar-AE", htmlLang: "ar-AE", dir: "rtl", folders: { glossary: "mustalahat", legislation: "tashriaat", faq: "asila-shaia" } });
  assert.equal(map.countries.ph.htmlLang, "fil-PH");
});

const kind = (a) => {
  const r = parseAddress(a, map);
  return r.ok ? r.kind : "ERROR: " + r.problems.join("; ");
};
ok(() => {
  assert.equal(kind("/us"), "home");
  assert.equal(kind("/it"), "home");
  assert.equal(kind("/us/amirikian-v-united-states"), "case");
  assert.equal(kind("/it/cgt-verona-265-2024"), "case");
  assert.equal(kind("/us/glossary"), "glossary-hub");
  assert.equal(kind("/us/glossary/funded-research"), "glossary-term");
  assert.equal(kind("/us/legislation"), "legislation-hub");
  assert.equal(kind("/us/legislation/section-41-d-4-excluded-activities"), "legislation-page");
  assert.equal(kind("/us/faq"), "faq-hub");
  assert.equal(kind("/us/faq/what-is-a-contemporaneous-record-for-rd-tax-credits"), "faq-question");
  assert.equal(kind("/au/legislation"), "legislation-hub");
  assert.equal(kind("/it/glossario/credito-d-imposta"), "glossary-term");
  assert.equal(kind("/at/haeufige-fragen"), "faq-hub");
  assert.equal(kind("/at/haeufige-fragen/was-ist-ein-forschungsprojekt"), "faq-question");
  assert.equal(kind("/jp/glossary/kenkyu-kaihatsu"), "glossary-term");
  assert.equal(kind("/ae"), "home");
  assert.equal(kind("/ae/tashriaat"), "legislation-hub");
  assert.equal(kind("/ae/tashriaat/qanun-alsharaib"), "legislation-page");
  assert.equal(kind("/ae/mustalahat"), "glossary-hub");
  assert.equal(kind("/ae/mustalahat/albahth-waltatwir"), "glossary-term");
  assert.equal(kind("/ae/asila-shaia"), "faq-hub");
  assert.equal(kind("/ae/asila-shaia/hal-ana-mawhil"), "faq-question");
  assert.equal(kind("/ae/some-case-2026"), "case");
  // the English folder names are not the UAE folders: /ae/glossary would be a case, so it is not a section
  assert.equal(kind("/ae/glossary"), "case");
});
ok(() => {
  const bad = {
    "/us/glossary/": "no trailing slash",
    "/us/glossary/Funded-Research": "lowercase",
    "/us/glossary/funded_research": "single hyphens",
    "/us/glossary/funded--research": "single hyphens",
    "/us/-funded": "none at the start or end",
    "/us/glossary/funded-research.html": "no .html",
    "https://rdtaxcases.com/us/glossary": "no domain",
    "us/glossary": "must start with /",
    "/it/glossario/crédito": "ASCII only",
    "/xx/abc": "not a country code",
    "/us/federal": "built by the site",
    "/us/states": "built by the site",
    "/it/en": "reserved",
    "/us/faq/question/extra": "too many levels",
    "/us/faq/Question-One": "lowercase",
    "/it/some-case/sub-page": "is a case",
    "/us/glossary/a/b": "too many levels",
    "/us/glossary/term?x=1": "no ? or #",
  };
  for (const [a, why] of Object.entries(bad)) {
    const r = parseAddress(a, map);
    assert.equal(r.ok, false, `${a} should be refused (${why})`);
  }
  // "glossary" is only a section folder where the country's glossary folder is called that
  assert.equal(parseAddress("/it/glossary", map).kind, "case");
});

const SHEET = `page address,Google Doc link,page title,description,case number,court,decision date
/us/glossary/funded-research,https://docs.google.com/document/d/1abcdefghijklmnopqrstuvwxyz/edit,Funded research,"Funded research, in one or two sentences.",,,
/it/cgt-verona-265-2024,https://docs.google.com/document/d/2abcdefghijklmnopqrstuvwxyz/edit,Caso Verona,Una descrizione.,265/2024,Corte di giustizia tributaria,2024-03-04
/it/glossario/,https://docs.google.com/document/d/3abcdefghijklmnopqrstuvwxyz/edit,Glossario,Glossario.,,,
/us/glossary/funded-research,https://docs.google.com/document/d/1abcdefghijklmnopqrstuvwxyz/edit,Again,Again.,,,
/de/fall-eins,https://example.com/doc,Fall,Beschreibung,,,
`;
ok(() => {
  assert.equal(parseCsv('a,"b,c","d ""e"""\n1,2,3').length, 2);
  assert.deepEqual(parseCsv('a,"b,c","d ""e"""\n1,2,3')[0], ["a", "b,c", 'd "e"']);
  const { rows, missingColumns, hasCaseColumns } = readDelivery(SHEET);
  assert.deepEqual(missingColumns, []);
  assert.equal(hasCaseColumns, true);
  assert.equal(rows.length, 5);
  const v = validateRows(rows, map, true);
  assert.equal(v[0].problems.length, 0, v[0].problems.join(";"));
  assert.equal(v[1].problems.length, 0, v[1].problems.join(";"));
  assert.ok(v[2].problems.some((p) => p.includes("trailing slash")));
  assert.ok(v[3].problems.some((p) => p.includes("same address")) && v[3].problems.some((p) => p.includes("same document")));
  assert.ok(v[4].problems.some((p) => p.includes("docs.google.com")));
  assert.ok(v[4].problems.some((p) => p.includes("case number is empty")));
});

ok(() => {
  const delivery = new Set(["/us/glossary/funded-research"]);
  const live = new Set(["/us/amirikian-v-united-states"]);
  const blocks = [{ type: "paragraph", text: 'See <a href="/us/glossary/funded-research">a</a>, <a href="/us/amirikian-v-united-states">b</a>, <a href="/us/glossary/missing">c</a>, <a href="https://www.swansonreed.com/x/">d</a>, <a href="/us/glossary/funded-research/">e</a>, <a href="/us/states/texas">f</a>.' }];
  const p = checkLinks(blocks, delivery, live, map);
  assert.equal(p.length, 3, p.join("\n"));
  assert.ok(p.some((x) => x.includes("/us/glossary/missing") && x.includes("not in this delivery")));
  assert.ok(p.some((x) => x.includes("another site")));
  assert.ok(p.some((x) => x.includes("trailing slash")));
});

console.log(`addresses and delivery sheet: ${n} groups of tests passed`);
