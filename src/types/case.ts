import { Jurisdiction } from "./jurisdiction";

/**
 * Content blocks mirror the structure of the client's source documents:
 * a law-review-style write-up with section headings and occasional
 * comparison tables. The "References"/"Works cited" section and any
 * trailing tool code in the source doc are dropped during import — they
 * never become blocks.
 */
export type CaseContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; caption?: string; headers: string[]; rows: string[][] };

export interface CaseRecord {
  slug: string;
  /** Official case name, e.g. "Amirikian v. United States". */
  title: string;
  /** Full law-review-style headline from the source doc, shown as a subtitle. */
  articleTitle?: string;
  /** Reporter citation, used as the searchable "case number" field per the brief. */
  caseNumber: string;
  /** Deciding court, e.g. "United States Court of Appeals for the Fourth Circuit". */
  court?: string;
  year: number;
  subject: string;
  jurisdictionGroup: Jurisdiction["group"];
  jurisdictionSlug: string;
  /** Official web page of the decision, when there is one. Not shown on the page. */
  sourceDocUrl?: string;
  /** Not used: the site does not publish PDFs. Kept only so older data files stay valid. */
  sourcePdfPath?: string;
  /** Language of the report (title/summary/body), as a BCP 47 code. Absent means English. */
  language?: string;
  summary: string;
  body: CaseContentBlock[];
  /**
   * Fields taken from the decision itself (new cases only; the USA cases are
   * not backfilled). Each is shown on the case page when present.
   */
  /** Date of the decision, ISO yyyy-mm-dd, as the decision states it. */
  decisionDate?: string;
  /** Parties as named in the decision (may be anonymised placeholders). */
  parties?: string;
  /** Outcome, in the language of the page, as the decision states it. */
  outcome?: string;
  /** ISO 3166-1 alpha-2 country code of the deciding court. */
  country?: string;
  /**
   * Where the PDF (or checked text) comes from, e.g. the official database
   * or court web page. `language` above is the page's content language.
   */
  pdfSource?: string;
  /**
   * Summary of the English text's state. The page itself reads
   * `translation.reviewed`, which is the source of truth.
   */
  translationStatus?: "none" | "machine-assisted" | "reviewed";
  /**
   * Publication state. Absent means "published". Drafts and withdrawn cases
   * are kept in the data but get no page, no listing entry, no search entry
   * and no sitemap entry.
   */
  status?: "draft" | "published" | "withdrawn";
  /** English alternate for a case whose primary title/summary/body are in another language. */
  translation?: {
    locale: string;
    title: string;
    articleTitle?: string;
    summary: string;
    body: CaseContentBlock[];
    /**
     * Set once the client's reviewer has checked the translation. Until
     * then the page labels the English text as machine-assisted and under
     * review. The flag lives in the translation's JSON file under
     * content/translations/.
     */
    reviewed: boolean;
  };
}
