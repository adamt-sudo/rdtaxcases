import { countries } from "@/data/countries";
import { usStateJurisdictions } from "@/data/jurisdictions";
import { knownAddresses } from "@/data/addresses.index";

const FIXED = new Set(["/", "/about", "/contact", "/copyright", "/search", "/us", "/us/federal", "/us/states", "/us/glossary", "/us/faq", "/us/legislation"]);
const PAGES = new Set(knownAddresses);
const STATES = new Set(usStateJurisdictions.map((s) => `/us/states/${s.slug}`));
const COUNTRIES = new Set(["us", ...countries.map((c) => c.slug)].map((c) => `/${c}`));

/**
 * True when a link to this path of the site leads to a page that exists. A link to a page that does not exist yet is shown
 * as plain text (InlineText), and becomes a link when the page is added.
 */
export function isKnownAddress(href: string): boolean {
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return FIXED.has(path) || STATES.has(path) || COUNTRIES.has(path) || PAGES.has(path);
}
