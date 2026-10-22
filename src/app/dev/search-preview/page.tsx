import { devSeedCases } from "@/dev-seed/search-test-cases";
import { CaseSearch } from "@/components/CaseSearch";

// TEMPORARY internal-only preview — not linked from site nav, not for the
// client. Exercises the search UI against 44 real (verified) case citations
// while the client decides how to handle the 90 flagged cases. Delete this
// route once src/data/cases.ts has real content to test against directly.
export const metadata = {
  title: "Search Preview (dev) | RDTAXCASES.com",
  robots: "noindex, nofollow",
};

export default function SearchPreviewPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Internal dev preview.</strong> This page tests the search UI
        against {devSeedCases.length} real, verified federal case citations
        (title/case number/court/year) with placeholder body text, not
        published data. Not linked from site navigation.
      </div>
      <h1 className="text-3xl font-bold text-slate-900">
        Search Cases (dev preview)
      </h1>
      <div className="mt-8">
        <CaseSearch cases={devSeedCases} />
      </div>
    </div>
  );
}
