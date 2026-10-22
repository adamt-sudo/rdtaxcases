import { notFound } from "next/navigation";
import { cases, getCaseBySlug } from "@/data/cases";
import { getJurisdictionBySlug } from "@/data/jurisdictions";
import { countries } from "@/data/countries";
import { CaseTranslationToggle } from "@/components/CaseTranslationToggle";

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseRecord = getCaseBySlug(slug);
  if (!caseRecord) return {};
  return {
    title: `${caseRecord.title} | RDTAXCASES.com`,
    description: caseRecord.summary,
  };
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseRecord = getCaseBySlug(slug);
  if (!caseRecord) notFound();

  const jurisdiction = getJurisdictionBySlug(
    caseRecord.jurisdictionGroup,
    caseRecord.jurisdictionSlug
  );

  // Mirrors the visible "← Back to [jurisdiction]" link's own branching
  // logic in CaseTranslationToggle, so the breadcrumb hierarchy can never
  // drift out of sync with the nav.
  const backHref =
    caseRecord.jurisdictionGroup === "usa-federal"
      ? "/usa/federal"
      : caseRecord.jurisdictionGroup === "country"
      ? `/${caseRecord.jurisdictionSlug}`
      : `/usa/states/${caseRecord.jurisdictionSlug}`;

  const breadcrumbTrail =
    caseRecord.jurisdictionGroup === "usa-federal"
      ? [
          { name: "Home", url: "https://rdtaxcases.com/" },
          { name: "USA Federal", url: "https://rdtaxcases.com/usa/federal" },
          {
            name: caseRecord.title,
            url: `https://rdtaxcases.com/cases/${caseRecord.slug}`,
          },
        ]
      : caseRecord.jurisdictionGroup === "country"
      ? [
          { name: "Home", url: "https://rdtaxcases.com/" },
          {
            name: jurisdiction?.name ?? caseRecord.jurisdictionSlug,
            url: `https://rdtaxcases.com${backHref}`,
          },
          {
            name: caseRecord.title,
            url: `https://rdtaxcases.com/cases/${caseRecord.slug}`,
          },
        ]
      : [
          { name: "Home", url: "https://rdtaxcases.com/" },
          { name: "USA States", url: "https://rdtaxcases.com/usa/states" },
          {
            name: jurisdiction?.name ?? caseRecord.jurisdictionSlug,
            url: `https://rdtaxcases.com/usa/states/${caseRecord.jurisdictionSlug}`,
          },
          {
            name: caseRecord.title,
            url: `https://rdtaxcases.com/cases/${caseRecord.slug}`,
          },
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

  const caseUrl = `https://rdtaxcases.com/cases/${caseRecord.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    // Stable identifier the /usa/federal and /usa/states listing pages'
    // Dataset.hasPart arrays reference by @id, rather than inlining a
    // duplicate (and inevitably incomplete) copy of this entity there.
    "@id": caseUrl,
    headline: caseRecord.title,
    description: caseRecord.summary,
    url: caseUrl,
    // Case pages have no individual thumbnail, so fall back to the site
    // logo (1942x809, above Google's recommended minimum width) to satisfy
    // the Article type's recommended "image" field.
    image: "https://rdtaxcases.com/branding/logo-full.png",
    // References the single Organization/ProfessionalService entity defined
    // once in the root layout (present on every page) rather than repeating it.
    // No individual byline exists anywhere on the site, so the Organization
    // itself is the accurate author (a valid Article.author type per
    // schema.org), rather than inventing a person's name.
    author: {
      "@id": "https://rdtaxcases.com/#organization",
    },
    publisher: {
      "@id": "https://rdtaxcases.com/#organization",
    },
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
        {jurisdiction?.name ?? caseRecord.jurisdictionSlug}
      </p>
      <CaseTranslationToggle
        caseRecord={caseRecord}
        jurisdictionName={jurisdiction?.name ?? "jurisdiction"}
        backHref={backHref}
        labels={country?.uiLabels}
      />
    </article>
  );
}
