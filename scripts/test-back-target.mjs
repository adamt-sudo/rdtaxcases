// Tests for the Back button's target (src/lib/back-target.mjs) and the case overrides. Run by `npm run check`.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { backPathFromReferrer } from "../src/lib/back-target.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let n = 0;
const ok = (fn) => {
  fn();
  n++;
};
const here = { hostname: "rdtaxcases.com", pathname: "/us/glossary/irc-section-41" };

ok(() => {
  // from a page of this site: back to that page
  assert.equal(backPathFromReferrer("https://rdtaxcases.com/us/kollsman-instrument-v-commissioner", here), "/us/kollsman-instrument-v-commissioner");
  assert.equal(backPathFromReferrer("https://www.rdtaxcases.com/us/faq/pre-revenue-startup-rd-tax-credit-eligibility", here), "/us/faq/pre-revenue-startup-rd-tax-credit-eligibility");
  assert.equal(backPathFromReferrer("https://rdtaxcases.com/us/glossary/", here), "/us/glossary", "a trailing slash is removed");
  assert.equal(backPathFromReferrer("https://rdtaxcases.com/us/federal?x=1#top", here), "/us/federal", "no query, no fragment");
  assert.equal(backPathFromReferrer("https://rdtaxcases.com/", here), "/", "the home page");
});
ok(() => {
  // otherwise: the list page stays (null)
  assert.equal(backPathFromReferrer("", here), null, "no referrer");
  assert.equal(backPathFromReferrer("https://www.google.com/search?q=r%26d", here), null, "a search engine");
  assert.equal(backPathFromReferrer("https://rdtaxcases.com.evil.example/us/federal", here), null, "a look-alike host");
  assert.equal(backPathFromReferrer("https://evilrdtaxcases.com/us/federal", here), null, "another domain ending in rdtaxcases.com");
  assert.equal(backPathFromReferrer("not a url", here), null);
  assert.equal(backPathFromReferrer("android-app://com.google.android.googlequicksearchbox", here), null);
  assert.equal(backPathFromReferrer("https://rdtaxcases.com/us/glossary/irc-section-41", here), null, "the same page (a reload)");
  assert.equal(backPathFromReferrer("https://rdtaxcases.com/admin/", here), null, "the editor");
  assert.equal(backPathFromReferrer("https://rdtaxcases.com/sitemap.xml", here), null, "a file");
});
ok(() => {
  // a preview or a local copy of the site: the host the visitor is on counts as this site
  const local = { hostname: "localhost", pathname: "/us/faq/x" };
  assert.equal(backPathFromReferrer("http://localhost:3100/us/glossary", local), "/us/glossary");
  assert.equal(backPathFromReferrer("http://localhost:3100/us/faq/x", local), null);
  assert.equal(backPathFromReferrer("http://other.example/us/glossary", local), null);
});

// ---- the Saykally decision date (corrected by the site owner) survives: the override file and the case agree
ok(() => {
  const ov = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "case-overrides.json"), "utf8")).cases;
  assert.equal(ov["saykally-v-commissioner"].decisionDate, "2007-09-07");
  const c = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "cases", "saykally-v-commissioner.json"), "utf8"));
  assert.equal(c.decisionDate, "2007-09-07");
  assert.equal(c.year, 2007);
});

console.log(`back button target and case overrides: ${n} groups of tests passed`);
