import { CaseContentBlock, CaseRecord } from "@/types/case";
import { caseRecords, translationRecords } from "./cases.index";

/**
 * Every case is one JSON file under content/cases/<slug>.json; the listing
 * order is content/case-order.json. src/data/cases.index.ts is generated from
 * them by scripts/build-case-index.mjs (run before every build and dev
 * start). Case content is imported from the client's source Google Docs,
 * with the "References"/"Works cited" section and any trailing tool code
 * stripped before publishing (per the project brief).
 */
/**
 * Stored shape vs site shape. The editor cannot edit a list of lists, so a
 * table row is stored as { "cells": [...] }; the site wants string[].
 */
type StoredBlock =
  | Exclude<CaseContentBlock, { type: "table" }>
  | {
      type: "table";
      caption?: string;
      headers: string[];
      rows: (string[] | { cells: string[] })[];
    };

function toBlock(b: StoredBlock): CaseContentBlock {
  if (b.type !== "table") return b;
  return {
    ...b,
    rows: b.rows.map((r) => (Array.isArray(r) ? r : r.cells)),
  };
}

/**
 * An English translation lives in its own file, content/translations/<slug>.json,
 * so that only the client's reviewer can approve it (see .github/CODEOWNERS).
 */
function assemble(c: CaseRecord): CaseRecord {
  const t = translationRecords[c.slug];
  const body = (c.body as unknown as StoredBlock[]).map(toBlock);
  return {
    ...c,
    body,
    ...(t
      ? {
          translation: {
            locale: t.locale,
            title: t.title,
            ...(t.articleTitle ? { articleTitle: t.articleTitle } : {}),
            summary: t.summary,
            body: (t.body as StoredBlock[]).map(toBlock),
            reviewed: t.reviewed === true,
          },
        }
      : {}),
  };
}

const allCases: CaseRecord[] = caseRecords.map(assemble);

// SHOW_DRAFTS=1 (build or dev, local use only) includes drafts so they can
// be viewed before they are cleared. Never set it for a deployed build.
const SHOW_DRAFTS = process.env.SHOW_DRAFTS === "1";

/** Cases that get a page, a listing entry, a search entry and a sitemap entry. */
export const cases: CaseRecord[] = allCases.filter(
  (c) => SHOW_DRAFTS || (c.status ?? "published") === "published"
);

export function getCaseBySlug(slug: string): CaseRecord | undefined {
  return cases.find((c) => c.slug === slug);
}

export function getCasesForJurisdiction(
  group: CaseRecord["jurisdictionGroup"],
  jurisdictionSlug: string
): CaseRecord[] {
  return cases.filter(
    (c) =>
      c.jurisdictionGroup === group && c.jurisdictionSlug === jurisdictionSlug
  );
}

export function getCasesForJurisdictionGroup(
  group: CaseRecord["jurisdictionGroup"]
): CaseRecord[] {
  return cases.filter((c) => c.jurisdictionGroup === group);
}
