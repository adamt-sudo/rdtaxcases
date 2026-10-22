import { usFederalJurisdiction } from "@/data/jurisdictions";
import { getCasesForJurisdiction } from "@/data/cases";
import { CaseList } from "@/components/CaseList";

export const metadata = {
  title: "USA Federal R&D Tax Credit Cases | RDTAXCASES.com",
};

export default function UsaFederalPage() {
  const federalCases = getCasesForJurisdiction("usa-federal", "federal");

  // No hasPart: Google's Dataset validation only accepts Dataset items
  // there, and a case ruling is an Article. Bare @id refs, name-only
  // Dataset items and typed Article items all failed Search Console
  // ("Invalid object type for field hasPart"), and hasPart is optional,
  // so it is omitted. Case links live in the visible list below.
  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": "https://rdtaxcases.com/usa/federal#dataset",
    name: "USA Federal R&D Tax Credit Case Rulings",
    description:
      "A collection of U.S. federal court rulings addressing research and development tax credit eligibility, documentation, and calculation.",
    url: "https://rdtaxcases.com/usa/federal",
    // schema.org's license property expects a CreativeWork or URL, not
    // free text — "Copyright Swanson Reed. All Rights Reserved." doesn't
    // satisfy either type, so this points at the site itself instead.
    license: "https://rdtaxcases.com",
    creator: {
      "@id": "https://rdtaxcases.com/#organization",
    },
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <h1 className="text-3xl font-bold text-slate-900">
        {usFederalJurisdiction.name}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        R&amp;D tax credit case law from U.S. federal courts.
      </p>
      <div className="mt-8">
        <CaseList cases={federalCases} />
      </div>
    </div>
  );
}
