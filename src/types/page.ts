import type { CaseContentBlock } from "./case";

/**
 * A page of the delivery that is not a case: a glossary term, a law (legislation page) or a FAQ question. It is one
 * JSON file, content/pages/<cc>/<section folder>/<slug>.json, and its address is that path (/us/glossary/irc-section-41).
 * The body uses the same content blocks as a case.
 */
export interface PageRecord {
  /** Path of the page, e.g. /us/glossary/irc-section-41. Generated from the file path. */
  address: string;
  kind: "glossary-term" | "legislation-page" | "faq-question";
  /** Two-letter code of the country in the sitemap. */
  country: string;
  /** The page title: the h1 of the source document. */
  title: string;
  /** Meta description (from the delivery sheet). Empty until the sheet gives one. */
  description?: string;
  /** Dates as the document states them (ISO yyyy-mm-dd). */
  published?: string;
  updated?: string;
  /** BCP 47 code of the page text, e.g. en-US. */
  language: string;
  /**
   * published: live and in the sitemap. preview: built at its address, but noindex and not in the sitemap
   * (for the site owner to review). draft: not built. Absent means published.
   */
  status?: "draft" | "preview" | "published";
  body: CaseContentBlock[];
}
