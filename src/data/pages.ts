import type { CaseContentBlock } from "@/types/case";
import type { PageRecord } from "@/types/page";
import { pageRecords } from "./pages.index";

/** Table rows are stored as { cells: [...] } (the editor cannot edit a list of lists); the site wants string[]. */
type StoredBlock = Exclude<CaseContentBlock, { type: "table" }> | { type: "table"; caption?: string; headers: string[]; rows: (string[] | { cells: string[] })[] };

function toBlock(b: StoredBlock): CaseContentBlock {
  return b.type !== "table" ? b : { ...b, rows: b.rows.map((r) => (Array.isArray(r) ? r : r.cells)) };
}

const all: PageRecord[] = pageRecords.map((p) => ({ ...p, body: (p.body as unknown as StoredBlock[]).map(toBlock) }));

/** Pages that are built: everything except drafts. A preview page is built at its address but stays noindex. */
export const getBuiltPages = (): PageRecord[] => all.filter((p) => p.status !== "draft");

/** Pages that search engines may index and the sitemap lists. */
export const getPublishedPages = (): PageRecord[] => all.filter((p) => (p.status ?? "published") === "published");

export function getPage(country: string, section: string, slug: string): PageRecord | undefined {
  return getBuiltPages().find((p) => p.address === `/${country}/${section}/${slug}`);
}
