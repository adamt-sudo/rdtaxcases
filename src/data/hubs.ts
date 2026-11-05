import siteMap from "../../content/site-map.json";

export type HubKind = "glossary" | "legislation" | "faq";

export interface CountryHub {
  kind: HubKind;
  /** Address of the hub page, e.g. /it/glossario */
  href: string;
}

type SiteMapCountry = { folders: Record<HubKind, string> };
const COUNTRIES = siteMap.countries as unknown as Record<string, SiteMapCountry>;

/** Address of a country's section hub, from the sitemap's folder names. */
export function hubHref(code: string, kind: HubKind): string | undefined {
  const folder = COUNTRIES[code]?.folders[kind];
  return folder ? `/${code}/${folder}` : undefined;
}

/**
 * The section hubs (glossary, legislation, FAQ) that have content for a country. Empty until the page
 * content model of Stage 2 delivers the pages: then this returns a hub as soon as it has a page.
 * A country page links its hubs, and is indexed as soon as it has a case or a hub.
 */
export function getCountryHubs(code: string): CountryHub[] {
  void code;
  return [];
}
