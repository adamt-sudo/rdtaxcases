import { countries } from "@/data/countries";
import { usStateJurisdictions } from "@/data/jurisdictions";
import { pageTitles } from "@/data/titles.index";

const FIXED_TITLES: Record<string, string> = {
  "/": "Home",
  "/us": "USA",
  "/us/federal": "USA Federal",
  "/us/states": "USA States",
  "/us/glossary": "Glossary",
  "/us/faq": "FAQ",
  "/us/legislation": "Legislation",
  "/search": "Search",
  "/about": "About",
  "/contact": "Contact",
  "/copyright": "Copyright",
};
const STATE_TITLES = Object.fromEntries(usStateJurisdictions.map((s) => [`/us/states/${s.slug}`, s.name]));
const COUNTRY_TITLES = Object.fromEntries(countries.map((c) => [`/${c.slug}`, c.name]));

/** The title of a page of this site by its path (cases, glossary, FAQ and legislation pages, lists, states, countries), or undefined. */
export function titleOfPath(path: string): string | undefined {
  const p = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return pageTitles[p] ?? FIXED_TITLES[p] ?? STATE_TITLES[p] ?? COUNTRY_TITLES[p];
}
