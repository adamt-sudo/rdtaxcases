import { SiteLink } from "@/components/SiteLink";
import { getPublishedPages } from "@/data/pages";
import { countries } from "@/data/countries";
import type { PageRecord } from "@/types/page";
import { absolute, countryHref, SITE } from "@/lib/urls";

type Kind = PageRecord["kind"];

// The folder name of each kind is the English one for the USA and Canada (the site map has the other countries' folders).
const HUBS: Record<Kind, { segment: string; label: string; singular: string; plural: string }> = {
  "glossary-term": { segment: "glossary", label: "Glossary", singular: "term", plural: "terms" },
  "faq-question": { segment: "faq", label: "FAQ", singular: "question", plural: "questions" },
  "legislation-page": { segment: "legislation", label: "Legislation", singular: "provision", plural: "provisions" },
};

/** The sentence under the title of a list page, by country. */
function blurb(country: string, kind: Kind, n: number): string {
  if (country === "ca") {
    if (kind === "glossary-term") return `Definitions of ${n} Canadian SR&ED terms. Each term has its own page.`;
    if (kind === "faq-question") return `Answers to ${n} questions about the SR&ED tax credit in Canada. Each question has its own page.`;
    return `${n} Income Tax Act sections and subsections on SR&ED in Canada, each with its own page.`;
  }
  if (kind === "glossary-term") return `Definitions of ${n} U.S. R&D tax credit terms. Each term has its own page.`;
  if (kind === "faq-question") return `Answers to ${n} questions about the U.S. R&D tax credit. Each question has its own page.`;
  return `${n} Internal Revenue Code sections and subsections on the U.S. R&D tax credit, each with its own page.`;
}

const COUNTRY_NAME = (code: string) => (code === "us" ? "United States" : (countries.find((c) => c.slug === code)?.name ?? code));

/** The pages of one type of one country (published only), in reading order. */
export function hubPages(country: string, kind: Kind): PageRecord[] {
  return getPublishedPages()
    .filter((p) => p.country === country && p.kind === kind)
    .sort((a, b) => a.title.localeCompare(b.title, "en", { numeric: true, sensitivity: "base" }));
}

/** The countries that have at least one published glossary, FAQ or legislation page: the USA first, then by name. */
export function hubCountries(): { code: string; name: string }[] {
  const codes = [...new Set(getPublishedPages().map((p) => p.country))];
  return codes
    .map((code) => ({ code, name: COUNTRY_NAME(code) }))
    .sort((a, b) => (a.code === "us" ? -1 : b.code === "us" ? 1 : a.name.localeCompare(b.name)));
}

export function hubAddress(country: string, kind: Kind): string {
  return `/${country}/${HUBS[kind].segment}`;
}

/** Title, description, canonical of a list page. It is indexable. */
export function hubMetadata(country: string, kind: Kind) {
  const n = hubPages(country, kind).length;
  const h = HUBS[kind];
  return {
    title: `${COUNTRY_NAME(country)} ${h.label}: ${n} ${n === 1 ? h.singular : h.plural} | RDTAXCASES.com`,
    description: blurb(country, kind, n),
    alternates: { canonical: hubAddress(country, kind) },
  };
}

/** A list page: /us/glossary, /us/faq, /us/legislation. It links to every page of its type. */
export function HubPage({ country, kind }: { country: string; kind: Kind }) {
  const h = HUBS[kind];
  const pages = hubPages(country, kind);
  const url = absolute(hubAddress(country, kind));
  const name = COUNTRY_NAME(country);
  const crumbs = [
    { name: "Home", url: absolute("/") },
    { name, url: absolute(countryHref(country)) },
    { name: h.label, url },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    name: `${name} ${h.label}: ${pages.length} ${pages.length === 1 ? h.singular : h.plural}`,
    description: blurb(country, kind, pages.length),
    url,
    publisher: { "@id": `${SITE}/#organization` },
    isPartOf: { "@id": `${SITE}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: pages.length,
      itemListElement: pages.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: absolute(p.address) })),
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
  };
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
        <SiteLink href={countryHref(country)} className="hover:underline">
          {name}
        </SiteLink>
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">
        {name} {h.label}
      </h1>
      <p className="mt-2 text-sm text-slate-600">{blurb(country, kind, pages.length)}</p>
      <ul className="mt-8 grid gap-x-8 gap-y-2 sm:grid-cols-2" data-hub-list>
        {pages.map((p) => (
          <li key={p.address}>
            <SiteLink href={p.address} className="text-blue-700 underline underline-offset-2 hover:text-blue-900 focus-visible:outline focus-visible:outline-2">
              {p.title}
            </SiteLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
