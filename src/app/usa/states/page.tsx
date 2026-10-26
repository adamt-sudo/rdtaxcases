import Link from "next/link";
import { usStateJurisdictions } from "@/data/jurisdictions";
import { getCasesForJurisdiction } from "@/data/cases";
import { StateDropdown } from "@/components/StateDropdown";

export const metadata = {
  title: "USA States R&D Tax Credit Cases | RDTAXCASES.com",
};

export default function UsaStatesPage() {
  // No hasPart: Google's Dataset validation only accepts Dataset items
  // there, and a case ruling is an Article. Bare @id refs, name-only
  // Dataset items and typed Article items all failed Search Console
  // ("Invalid object type for field hasPart"), and hasPart is optional,
  // so it is omitted. Case links live in the visible list below.
  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": "https://rdtaxcases.com/usa/states#dataset",
    name: "USA State R&D Tax Credit Case Rulings",
    description:
      "A collection of U.S. state court and tax tribunal rulings addressing research and development tax credit eligibility, documentation, and calculation, organized by state.",
    url: "https://rdtaxcases.com/usa/states",
    // schema.org's license property expects a CreativeWork or URL, not
    // free text — "Copyright Swanson Reed. All Rights Reserved." doesn't
    // satisfy either type, so this points at the site itself instead.
    license: "https://rdtaxcases.com",
    creator: {
      "@id": "https://rdtaxcases.com/#organization",
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <h1 className="text-3xl font-bold text-slate-900">USA States</h1>
      <p className="mt-2 text-sm text-slate-600">
        Select a state to view its R&amp;D tax credit case law. Most states
        currently have no published cases; the section exists as a
        placeholder for future content.
      </p>

      <div className="mt-6 max-w-xs">
        <StateDropdown />
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 md:grid-cols-4">
        {usStateJurisdictions.map((state) => {
          const count = getCasesForJurisdiction(
            "usa-states",
            state.slug
          ).length;
          return (
            <li key={state.slug}>
              <Link
                href={`/usa/states/${state.slug}`}
                className="flex items-baseline justify-between gap-2 rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-700"
              >
                <span>{state.name}</span>
                <span className="text-xs text-slate-600">{count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
