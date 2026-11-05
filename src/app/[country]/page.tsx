import { SiteLink } from "@/components/SiteLink";
import { notFound } from "next/navigation";
import { countries } from "@/data/countries";
import { getCasesForJurisdiction } from "@/data/cases";
import { getCountryHubs, type HubKind } from "@/data/hubs";

const HUB_LABEL: Record<HubKind, string> = { glossary: "Glossary", legislation: "Legislation", faq: "FAQ" };
import { CaseList } from "@/components/CaseList";
import { DocumentLangSetter } from "@/components/DocumentLangSetter";
import { COUNTRIES_LIVE } from "@/lib/scope";

// Without the country pages (NEXT_PUBLIC_HIDE_COUNTRY_PAGES=1) one stand-in path is built, because a static
// export needs at least one; scripts/remove-placeholder-page.mjs takes it out after the build.
export const dynamicParams = false;

export function generateStaticParams() {
  return COUNTRIES_LIVE ? countries.map((c) => ({ country: c.slug })) : [{ country: "xx" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: countrySlug } = await params;
  const country = countries.find((c) => c.slug === countrySlug);
  if (!country) return {};
  const hasContent =
    getCasesForJurisdiction("country", country.slug).length > 0 ||
    getCountryHubs(country.slug).length > 0;
  return {
    title: `${country.name} R&D Tax Credit Cases | RDTAXCASES.com`,
    description: country.uiLabels.description,
    alternates: { canonical: `/${country.slug}` },
    // A country page with nothing at all (no published case and no section hub) stays out of
    // search engines until it has some content.
    ...(hasContent ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: countrySlug } = await params;
  const country = countries.find((c) => c.slug === countrySlug);
  if (!country) notFound();

  const countryCases = getCasesForJurisdiction("country", country.slug);
  const hubs = getCountryHubs(country.slug);

  // No hasPart, matching /us/federal and /us/states (see comment there).
  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `https://rdtaxcases.com/${country.slug}#dataset`,
    name: `${country.name} R&D Tax Credit Case Rulings`,
    description: country.uiLabels.description,
    url: `https://rdtaxcases.com/${country.slug}`,
    license: "https://rdtaxcases.com",
    creator: {
      "@id": "https://rdtaxcases.com/#organization",
    },
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <DocumentLangSetter locale={country.locale} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <h1 className="text-3xl font-bold text-slate-900">
        {country.nativeName}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {country.uiLabels.description}
      </p>
      <div className="mt-8">
        {countryCases.length > 0 ? (
          <CaseList cases={countryCases} />
        ) : (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {country.uiLabels.noCases}
          </p>
        )}
      </div>
      {hubs.length > 0 && (
        // The country's sections. The words are English until the localized site text (Stage 3).
        <ul className="mt-6 flex flex-wrap gap-3 text-sm">
          {hubs.map((h) => (
            <li key={h.kind}>
              <SiteLink
                href={h.href}
                className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700"
              >
                {HUB_LABEL[h.kind]}
              </SiteLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
