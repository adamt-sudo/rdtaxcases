import { getJurisdictionBySlug } from "@/data/jurisdictions";
import { countries } from "@/data/countries";
import { CaseTranslationToggle } from "@/components/CaseTranslationToggle";
import { CopyAttribution } from "@/components/CopyAttribution";
import type { CaseRecord } from "@/types/case";
import { absolute, caseHref, countryHref, listingHref, SITE, stateHref, US_FEDERAL, US_STATES } from "@/lib/urls";

const NOTICE =
  "© 2026 Swanson Reed. All rights reserved. Published at RDTAXCASES.com; see https://rdtaxcases.com/copyright";

/** Title, description and canonical of a case page (used by both case routes). */
export function caseMetadata(caseRecord: CaseRecord | undefined) {
  if (!caseRecord) return {};
  return {
    title: `${caseRecord.title} | RDTAXCASES.com`,
    description: caseRecord.summary,
    alternates: { canonical: caseHref(caseRecord) },
  };
}

/** One case page: /us/[case] or /[cc]/[case]. */
export function CasePage({ caseRecord }: { caseRecord: CaseRecord }) {
  const jurisdiction = getJurisdictionBySlug(caseRecord.jurisdictionGroup, caseRecord.jurisdictionSlug);
  const jurisdictionName = jurisdiction?.name ?? caseRecord.jurisdictionSlug;

  // The visible "← Back to [jurisdiction]" link and the breadcrumb use the same address,
  // so the hierarchy can never drift out of sync with the navigation.
  const backHref = listingHref(caseRecord);
  const caseUrl = absolute(caseHref(caseRecord));

  const breadcrumbTrail =
    caseRecord.jurisdictionGroup === "usa-federal"
      ? [
          { name: "Home", url: absolute("/") },
          { name: "USA Federal", url: absolute(US_FEDERAL) },
          { name: caseRecord.title, url: caseUrl },
        ]
      : caseRecord.jurisdictionGroup === "country"
        ? [
            { name: "Home", url: absolute("/") },
            { name: jurisdictionName, url: absolute(countryHref(caseRecord.jurisdictionSlug)) },
            { name: caseRecord.title, url: caseUrl },
          ]
        : [
            { name: "Home", url: absolute("/") },
            { name: "USA States", url: absolute(US_STATES) },
            { name: jurisdictionName, url: absolute(stateHref(caseRecord.jurisdictionSlug)) },
            { name: caseRecord.title, url: caseUrl },
          ];

  const country =
    caseRecord.jurisdictionGroup === "country"
      ? countries.find((c) => c.slug === caseRecord.jurisdictionSlug)
      : undefined;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbTrail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: step.url,
    })),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    // Stable identifier the US listing pages' Dataset entries can reference by @id.
    "@id": caseUrl,
    headline: caseRecord.title,
    description: caseRecord.summary,
    url: caseUrl,
    // Case pages have no individual thumbnail, so fall back to the site logo.
    image: `${SITE}/branding/logo-full.png`,
    // The single Organization entity defined once in the root layout is the author and publisher.
    author: { "@id": `${SITE}/#organization` },
    publisher: { "@id": `${SITE}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": caseUrl },
    copyrightHolder: { "@type": "Organization", name: "Swanson Reed", url: "https://www.swansonreed.com/" },
    copyrightYear: 2026,
    copyrightNotice: NOTICE,
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <p className="text-xs font-medium uppercase tracking-wide text-blue-700">{jurisdictionName}</p>
      <CopyAttribution url={caseUrl} title={caseRecord.title} />
      <CaseTranslationToggle
        caseRecord={caseRecord}
        jurisdictionName={jurisdiction?.name ?? "jurisdiction"}
        backHref={backHref}
        labels={country?.uiLabels}
        caseUrl={caseUrl}
      />
    </article>
  );
}
