import { BackLink } from "@/components/BackLink";
import { CaseBody } from "@/components/CaseBody";
import { SiteLink } from "@/components/SiteLink";
import { countries } from "@/data/countries";
import type { PageRecord } from "@/types/page";
import { absolute, countryHref, SITE } from "@/lib/urls";
import { hubAddress } from "@/components/HubPage";

const SECTION_LABEL: Record<PageRecord["kind"], string> = {
  "glossary-term": "Glossary",
  "legislation-page": "Legislation",
  "faq-question": "FAQ",
};

const countryName = (code: string) => (code === "us" ? "United States" : (countries.find((c) => c.slug === code)?.name ?? code));

/** Title, description, canonical and robots of a glossary / law / FAQ page. A preview page is noindex. */
export function pageMetadata(page: PageRecord | undefined) {
  if (!page) return {};
  return {
    title: `${page.title} | RDTAXCASES.com`,
    ...(page.description ? { description: page.description } : {}),
    alternates: { canonical: page.address },
    ...((page.status ?? "published") === "published" ? {} : { robots: { index: false, follow: true } }),
  };
}

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

/** One glossary / law / FAQ page, as the document delivered it: title, dates line, then the text. */
export function PageView({ page }: { page: PageRecord }) {
  const url = absolute(page.address);
  const country = countryName(page.country);
  const crumbs = [
    { name: "Home", url: absolute("/") },
    { name: country, url: absolute(countryHref(page.country)) },
    { name: page.title, url },
  ];
  const modified = page.updated ?? page.published;
  const common = {
    "@context": "https://schema.org",
    "@id": url,
    ...(page.description ? { description: page.description } : {}),
    url,
    inLanguage: page.language,
    ...(page.published ? { datePublished: page.published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    image: `${SITE}/branding/logo-full.png`,
    author: { "@id": `${SITE}/#organization` },
    publisher: { "@id": `${SITE}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
  // One structured-data block per page type: a FAQ question is a FAQPage (its answer is the answer capsule shown first on
  // the page); a law is an Article about a Legislation; a glossary term is an Article.
  const jsonLd =
    page.kind === "faq-question"
      ? {
          ...common,
          "@type": "FAQPage",
          name: page.title,
          mainEntity: {
            "@type": "Question",
            name: page.title,
            acceptedAnswer: { "@type": "Answer", text: page.summary ?? page.description ?? page.title },
          },
        }
      : page.kind === "legislation-page"
        ? { ...common, "@type": "Article", headline: page.title, about: { "@type": "Legislation", name: page.title, legislationJurisdiction: country } }
        : { ...common, "@type": "Article", headline: page.title };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
  };
  return (
    <article className="mx-auto max-w-3xl px-6 py-12" lang={page.language}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <BackLink fallbackHref={hubAddress(page.country, page.kind)} fallbackName={`${country} ${SECTION_LABEL[page.kind]}`} />
      <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
        {SECTION_LABEL[page.kind]} &middot;{" "}
        <SiteLink href={countryHref(page.country)} className="hover:underline">
          {country}
        </SiteLink>
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{page.title}</h1>
      {page.published && (
        <p className="mt-2 text-sm text-slate-600">
          <time dateTime={page.published}>{longDate(page.published)}</time>
          {page.updated && page.updated !== page.published && (
            <>
              {" "}
              (verified and updated <time dateTime={page.updated}>{longDate(page.updated)}</time>)
            </>
          )}
        </p>
      )}
      <CaseBody blocks={page.body} />
    </article>
  );
}
