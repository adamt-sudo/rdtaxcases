// The one place that knows what a page's address is.
//
//   US cases            /us/[case]
//   country cases       /[cc]/[case]                  ([cc] = the country's two-letter code)
//   US listing pages    /us/federal   /us/states   /us/states/[state]
//   country home        /[cc]
//
// Addresses have no trailing slash, are lowercase, and the site's canonical host has no "www".
import type { CaseRecord } from "@/types/case";

export const SITE = "https://rdtaxcases.com";

export const US_HOME = "/us";
export const US_FEDERAL = "/us/federal";
export const US_STATES = "/us/states";
export const stateHref = (stateSlug: string) => `${US_STATES}/${stateSlug}`;
export const countryHref = (code: string) => `/${code}`;

/** Address (path) of a case page. */
export function caseHref(c: Pick<CaseRecord, "slug" | "jurisdictionGroup" | "jurisdictionSlug">): string {
  return c.jurisdictionGroup === "country" ? `/${c.jurisdictionSlug}/${c.slug}` : `${US_HOME}/${c.slug}`;
}

/** The listing page a case belongs to ("Back to ..."). */
export function listingHref(c: Pick<CaseRecord, "jurisdictionGroup" | "jurisdictionSlug">): string {
  if (c.jurisdictionGroup === "usa-federal") return US_FEDERAL;
  if (c.jurisdictionGroup === "country") return countryHref(c.jurisdictionSlug);
  return stateHref(c.jurisdictionSlug);
}

/** Absolute address, for canonical links, the sitemap and structured data. */
export const absolute = (path: string) => (path === "/" ? SITE : `${SITE}${path}`);
