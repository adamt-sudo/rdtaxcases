// Tests for scripts/explain-failure.mjs: the red lines of a failed check become "which page, which box, where in /admin".
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { errorsIn, explain, whereInEditor } from "./explain-failure.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let groups = 0;
const group = (name, fn) => {
  fn();
  groups++;
};

// real files of the repository: one Canada case, one Canada FAQ page, one USA glossary page
const caCase = fs.readdirSync(path.join(ROOT, "content", "cases")).find((f) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", "cases", f), "utf8")).jurisdictionSlug === "ca");
const caFaq = fs.readdirSync(path.join(ROOT, "content", "pages", "ca", "faq"))[0];
const usGlossary = fs.readdirSync(path.join(ROOT, "content", "pages", "us", "glossary"))[0];

group("a file is placed in its list of /admin", () => {
  assert.equal(whereInEditor(`content/cases/${caCase}`).list, "Canada cases");
  assert.equal(whereInEditor(`content/pages/ca/faq/${caFaq}`).list, "Canada FAQ");
  assert.equal(whereInEditor(`content/pages/us/glossary/${usGlossary}`).list, "USA glossary");
  assert.equal(whereInEditor("src/data/cases.index.ts"), null);
});

group("the error lines are found, once each", () => {
  const log = [`::error file=content/cases/${caCase}::The field "Court" is empty.`, `::error file=content/cases/${caCase}::The field "Court" is empty.`, "::warning file=x::ignored", "::error::No file"].join("\n");
  assert.deepEqual(errorsIn([log]), [
    { file: `content/cases/${caCase}`, message: 'The field "Court" is empty.' },
    { file: null, message: "No file" },
  ]);
});

group("the instruction names the page, the box and the list", () => {
  const text = explain([`::error file=content/cases/${caCase}::The field "Court" is empty.\n::error file=content/pages/ca/faq/${caFaq}::The meta description is 160 characters. At most 155.\n::error file=src/x.ts::Something else`]);
  assert.match(text, /Canada cases/);
  assert.match(text, /The field "Court" is empty\./);
  assert.match(text, /Canada FAQ/);
  assert.match(text, /At most 155/);
  assert.match(text, /click \*\*Publish\*\* again/);
  assert.match(text, /Tell the developer/);
  assert.match(text, /nothing new goes live/);
});

group("with no error lines it says what to do", () => {
  assert.match(explain(["nothing here"]), /screenshot/);
});

console.log(`failure explanation: ${groups} groups of tests passed`);
