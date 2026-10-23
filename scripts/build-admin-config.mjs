// Build public/admin/config.yml, the settings of the case editor (Decap CMS).
//
// The file is written as JSON, which is valid YAML, so it can be generated
// without a YAML library. The lists of US states and countries come from
// src/data/jurisdictions.ts and src/data/countries.ts, so a new country or
// state shows up in the editor's drop-down by itself.
//
// Placeholders (set these when the client's accounts exist; nothing secret
// goes here):
//   ADMIN_REPO      GitHub "owner/name" of the repository (default adamt-sudo/rdtaxcases)
//   ADMIN_AUTH_URL  address of the login helper (Cloudflare Worker)
//   ADMIN_BRANCH    branch the editor publishes to (default main)
//
// Usage: node scripts/build-admin-config.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function loadTs(rel) {
  const file = path.join(ROOT, rel);
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  const localRequire = (id) => {
    if (id === "@/types/jurisdiction") return {};
    if (id.startsWith("./")) return loadTs(path.join(path.dirname(rel), id.slice(2) + ".ts"));
    throw new Error("unexpected import " + id);
  };
  vm.runInNewContext(js, { module: mod, exports: mod.exports, require: localRequire, console });
  return mod.exports;
}

const { countries } = loadTs("src/data/countries.ts");
const { usStateJurisdictions } = loadTs("src/data/jurisdictions.ts");

const REPO = process.env.ADMIN_REPO || "adamt-sudo/rdtaxcases";
const AUTH_URL = process.env.ADMIN_AUTH_URL || "https://REPLACE-WORKER.REPLACE-ACCOUNT.workers.dev";
const BRANCH = process.env.ADMIN_BRANCH || "main";

const str = (label, name, extra = {}) => ({ label, name, widget: "string", ...extra });
const text = (label, name, extra = {}) => ({ label, name, widget: "text", ...extra });

// The five block types a case body is made of (src/types/case.ts).
const blockTypes = [
  { label: "Heading", name: "heading", widget: "object", fields: [str("Text", "text")] },
  { label: "Subheading", name: "subheading", widget: "object", fields: [str("Text", "text")] },
  { label: "Paragraph", name: "paragraph", widget: "object", fields: [text("Text", "text")] },
  {
    label: "List",
    name: "list",
    widget: "object",
    fields: [{ label: "Items", name: "items", widget: "list", field: text("Item", "item") }],
  },
  {
    label: "Table",
    name: "table",
    widget: "object",
    fields: [
      str("Caption (optional)", "caption", { required: false }),
      {
        label: "Column headings",
        name: "headers",
        widget: "list",
        field: str("Heading", "heading"),
      },
      {
        label: "Rows",
        name: "rows",
        widget: "list",
        fields: [{ label: "Cells", name: "cells", widget: "list", field: text("Cell", "cell") }],
      },
    ],
  },
];

const body = {
  label: "Case text",
  name: "body",
  widget: "list",
  types: blockTypes,
  hint:
    "Build the page from blocks. No reference list and no footnote markers. " +
    "Put quotation marks only around the court's exact words.",
};

function caseFields({ group, slugField }) {
  return [
    str("Slug (web address)", "slug", {
      hint: "Lowercase letters, numbers and hyphens. Cannot be changed after saving.",
      pattern: ["^[a-z0-9]+(-[a-z0-9]+)*$", "Use lowercase letters, numbers and hyphens only"],
    }),
    str("Title", "title", { hint: "Case name as it is cited" }),
    str("Subtitle", "articleTitle", { required: false }),
    str("Case number", "caseNumber", {
      hint: "Docket number or citation exactly as printed on the decision",
    }),
    str("Court", "court", { required: false, hint: "Full name of the deciding court" }),
    { label: "Year", name: "year", widget: "number", value_type: "int", min: 1800, max: 2100 },
    str("Decision date", "decisionDate", {
      required: false,
      hint: "As the decision states it, yyyy-mm-dd",
      pattern: ["^\\d{4}-\\d{2}-\\d{2}$", "Use yyyy-mm-dd"],
    }),
    str("Parties", "parties", {
      required: false,
      hint: 'As named in the decision, separate with " / " (anonymised names stay as printed)',
    }),
    text("Outcome", "outcome", {
      required: false,
      hint: "The decision's own words, copied exactly",
    }),
    str("Subject", "subject"),
    { label: "Section", name: "jurisdictionGroup", widget: "hidden", default: group },
    slugField,
    str("Country code", "country", {
      required: false,
      hint: "Two letters, e.g. IT. Countries only.",
      pattern: ["^[A-Z]{2}$", "Two capital letters"],
    }),
    str("Language of the page text", "language", {
      required: false,
      hint: "Code of the language the text is written in, e.g. it, de, es. Leave empty for English.",
    }),
    str("Source link", "sourceDocUrl", {
      required: false,
      hint: "Official page of the decision where there is one",
    }),
    {
      label: "Source PDF",
      name: "sourcePdfPath",
      widget: "file",
      required: false,
      hint: "PDF of the decision itself, text-based. Use the case slug as the file name.",
    },
    str("Where the PDF comes from", "pdfSource", {
      required: false,
      hint: "Name the official site or database",
    }),
    {
      label: "Publication state",
      name: "status",
      widget: "select",
      required: false,
      default: "draft",
      options: [
        { label: "Published", value: "published" },
        { label: "Draft (kept, not shown)", value: "draft" },
        { label: "Withdrawn (kept, not shown)", value: "withdrawn" },
      ],
    },
    text("Summary", "summary", { hint: "Two to four sentences, from the decision" }),
    body,
  ];
}

const stateSelect = {
  label: "State",
  name: "jurisdictionSlug",
  widget: "select",
  options: usStateJurisdictions.map((s) => ({ label: s.name, value: s.slug })),
};
const federalHidden = { label: "Federal", name: "jurisdictionSlug", widget: "hidden", default: "federal" };
const countrySelect = {
  label: "Country",
  name: "jurisdictionSlug",
  widget: "select",
  options: [...countries]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ label: c.name, value: c.slug })),
};

const caseCollection = (name, label, group, slugField, description) => ({
  name,
  label,
  description,
  folder: "content/cases",
  extension: "json",
  format: "json",
  create: true,
  delete: true,
  slug: "{{fields.slug}}",
  identifier_field: "title",
  summary: "{{title}}, {{caseNumber}}",
  sortable_fields: ["title", "year"],
  filter: { field: "jurisdictionGroup", value: group },
  fields: caseFields({ group, slugField }),
});

const config = {
  backend: {
    name: "github",
    repo: REPO,
    branch: BRANCH,
    base_url: AUTH_URL,
    auth_endpoint: "auth",
    commit_messages: {
      create: 'Add {{collection}} "{{slug}}"',
      update: 'Edit {{collection}} "{{slug}}"',
      delete: 'Delete {{collection}} "{{slug}}"',
      uploadMedia: 'Upload "{{path}}"',
      deleteMedia: 'Delete "{{path}}"',
      openAuthoring: "{{message}}",
    },
  },
  // Every change becomes a draft first; publishing is a separate step that
  // only the people with merge rights on the repository can complete.
  publish_mode: "editorial_workflow",
  media_folder: "public/documents",
  public_folder: "/documents",
  site_url: "https://rdtaxcases.com",
  display_url: "https://rdtaxcases.com",
  locale: "en",
  collections: [
    caseCollection(
      "usa_federal",
      "USA federal cases",
      "usa-federal",
      federalHidden,
      "Cases from federal courts and agencies.",
    ),
    caseCollection(
      "usa_states",
      "USA state cases",
      "usa-states",
      stateSelect,
      "Cases from state courts and agencies.",
    ),
    caseCollection(
      "countries",
      "Country cases",
      "country",
      countrySelect,
      "Cases from other countries. The text is written in the language of the decision.",
    ),
    {
      name: "translations",
      label: "English translations (reviewer only)",
      description:
        "One file per case, block for block with the case text. Only the reviewer sets Reviewed.",
      folder: "content/translations",
      extension: "json",
      format: "json",
      create: true,
      delete: true,
      slug: "{{fields.slug}}",
      identifier_field: "title",
      summary: "{{title}}",
      fields: [
        str("Slug of the case", "slug", {
          pattern: ["^[a-z0-9]+(-[a-z0-9]+)*$", "Use the case's slug exactly"],
        }),
        { label: "Language", name: "locale", widget: "hidden", default: "en" },
        str("Title", "title"),
        str("Subtitle", "articleTitle", { required: false }),
        text("Summary", "summary"),
        body,
        {
          label: "Reviewed",
          name: "reviewed",
          widget: "boolean",
          default: false,
          hint: "Only the reviewer sets this. Until then the page says: English translation, machine-assisted, under review.",
        },
      ],
    },
  ],
};

const out = path.join(ROOT, "public", "admin", "config.yml");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(
  out,
  "# GENERATED by scripts/build-admin-config.mjs. Do not edit by hand.\n" +
    "# JSON is valid YAML.\n" +
    JSON.stringify(config, null, 2) +
    "\n",
);
console.log(
  `admin config: ${config.collections.length} collections, repo ${REPO}, login ${AUTH_URL}`,
);
