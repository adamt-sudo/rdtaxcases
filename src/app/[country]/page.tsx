import { notFound } from "next/navigation";
import { countries } from "@/data/countries";
import { getCasesForJurisdiction } from "@/data/cases";
import { CaseList } from "@/components/CaseList";
import { DocumentLangSetter } from "@/components/DocumentLangSetter";

export function generateStaticParams() {
  return countries.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: countrySlug } = await params;
  const country = countries.find((c) => c.slug === countrySlug);
  if (!country) return {};
  const hasCases =
    getCasesForJurisdiction("country", country.slug).length > 0;
  return {
    title: `${country.name} R&D Tax Credit Cases | RDTAXCASES.com`,
    description: country.uiLabels.description,
    // A country page with no published case stays out of search engines
    // until a case exists.
    ...(hasCases ? {} : { robots: { index: false, follow: true } }),
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

  // No hasPart, matching /usa/federal and /usa/states (see comment there).
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
    </div>
  );
}
