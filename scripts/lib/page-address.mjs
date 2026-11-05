// The address rules for the pages the delivery adds (the link spec sent to the site owner), as code.
//
//   /[cc]                          country home
//   /[cc]/[case]                   case                       (US cases: /us/[case])
//   /[cc]/[glossary-folder]        glossary hub
//   /[cc]/[glossary-folder]/[term] glossary term
//   /[cc]/[legislation-folder]     legislation hub
//   /[cc]/[legislation-folder]/[law]
//   /[cc]/[faq-folder]             FAQ: one page per country, no sub-pages
// Paths only, lowercase, a-z 0-9 and single hyphens, no trailing slash, no .html. Reserved: "en" in every country,
// and "federal" and "states" in /us (the site builds /us/federal, /us/states and /us/states/[state] itself).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const MAX_SLUG = 100;

export function loadSiteMap(file = path.join(__dirname, "..", "..", "content", "site-map.json")) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** Check one address. Returns { ok, problems, kind, cc, slug, hub }. kind: home | case | glossary-hub | glossary-term | legislation-hub | legislation-page | faq. */
export function parseAddress(address, siteMap) {
  const problems = [];
  const bad = (m) => problems.push(m);
  const a = String(address ?? "").trim();
  if (a !== address) bad("has spaces around it");
  if (!a.startsWith("/")) bad("must start with / and have no domain (paths only)");
  if (/^https?:/i.test(a) || a.includes("//")) bad("no domain and no double slash: paths only");
  if (/[?#]/.test(a)) bad("no ? or # in a page address");
  if (a.length > 1 && a.endsWith("/")) bad("no trailing slash");
  if (/\.html?$/i.test(a)) bad("no .html");
  if (/[A-Z]/.test(a)) bad("lowercase only");
  if (/[^\x20-\x7e]/.test(a)) bad("ASCII only (no accents)");
  const parts = a.split("/").filter(Boolean);
  for (const p of parts) {
    if (!SLUG.test(p)) bad(`"${p}": use only a-z, 0-9 and single hyphens (none at the start or end)`);
    if (p.length > MAX_SLUG) bad(`"${p}" is longer than ${MAX_SLUG} characters`);
  }
  if (!parts.length) bad("empty address");
  if (problems.length) return { ok: false, problems };

  const [cc, x, y, ...rest] = parts;
  const country = siteMap.countries[cc];
  if (!country) return { ok: false, problems: [`"${cc}" is not a country code of the sitemap`] };
  if (rest.length) return { ok: false, problems: ["too many levels: at most /[cc]/[section]/[page]"] };
  if (!x) return { ok: true, problems: [], kind: "home", cc };

  const { glossary, legislation, faq } = country.folders;
  const reserved = [...siteMap.reserved.all, ...(siteMap.reserved[cc] ?? [])];
  if (x === glossary || x === legislation || x === faq) {
    const hub = x === glossary ? "glossary" : x === legislation ? "legislation" : "faq";
    if (!y) return { ok: true, problems: [], kind: hub === "faq" ? "faq" : `${hub}-hub`, cc, hub };
    if (hub === "faq") return { ok: false, problems: [`/${cc}/${x} is a single FAQ page: it has no sub-pages`] };
    return { ok: true, problems: [], kind: hub === "glossary" ? "glossary-term" : "legislation-page", cc, hub, slug: y };
  }
  if (reserved.includes(x)) {
    const why = cc === "us" && (x === "federal" || x === "states") ? "is built by the site (listing pages are not delivered)" : "is reserved";
    return { ok: false, problems: [`"${x}" ${why}`] };
  }
  if (y) return { ok: false, problems: [`/${cc}/${x} is a case: it has no sub-pages (the section folders of ${cc} are ${glossary}, ${legislation}, ${faq})`] };
  return { ok: true, problems: [], kind: "case", cc, slug: x };
}
