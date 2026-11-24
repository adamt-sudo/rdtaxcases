import { countries } from "@/data/countries";
import { usStateJurisdictions } from "@/data/jurisdictions";
import { pageTitles } from "@/data/titles.index";

const FIXED_TITLES: Record<string, string> = {
  "/": "Home",
  "/us": "USA",
  "/us/federal": "USA Federal",
  "/us/states": "USA States",
  "/search": "Search",
  "/about": "About",
  "/contact": "Contact",
  "/copyright": "Copyright",
};
const STATE_TITLES = Object.fromEntries(usStateJurisdictions.map((s) => [`/us/states/${s.slug}`, s.name]));
const COUNTRY_TITLES = Object.fromEntries(countries.map((c) => [`/${c.slug}`, c.name]));

/** The title of a page of this site by its path (cases, glossary, FAQ and legislation pages, lists, states, countries), or undefined. */
const HUB_LABELS: Record<string, string> = { glossary: "Glossary", faq: "FAQ", legislation: "Legislation" };

export function titleOfPath(path: string): string | undefined {
  const p = path.length > 1 ? path.replace(/\/+$/, "") : path;
  // the list pages: "Canada Glossary", "United States FAQ"
  const hub = p.match(/^\/([a-z]{2})\/(glossary|faq|legislation)$/);
  if (hub) {
    const name = hub[1] === "us" ? "United States" : COUNTRY_TITLES[`/${hub[1]}`];
    if (name) return `${name} ${HUB_LABELS[hub[2]]}`;
  }
  return pageTitles[p] ?? FIXED_TITLES[p] ?? STATE_TITLES[p] ?? COUNTRY_TITLES[p];
}
