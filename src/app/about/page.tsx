export const metadata = {
  title: "About | RDTAXCASES.com",
  description:
    "RDTAXCASES.com is a dedicated research database created by Swanson Reed, aggregating U.S. R&D tax credit legal decisions into a single, accessible repository.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            About RDTAXCASES.com
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            A Swanson Reed Database
          </h1>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="space-y-6 text-base leading-relaxed text-slate-700">
          <p>
            rdtaxcases.com is a dedicated research database created by
            Swanson Reed, one of the nation&rsquo;s leading specialist R&amp;D
            tax advisory firms. Designed specifically for corporate tax
            teams, CPAs, and legal counsel, the platform aggregates U.S.
            Research and Development (R&amp;D) tax credit legal decisions
            into a single, accessible repository.
          </p>
          <p>
            The platform continuously monitors judicial activity, delivering
            weekly updates on both federal and state court decisions. In an
            environment where tax authorities like the IRS and state
            departments of revenue are increasing scrutiny on qualified
            research activities (QRA) and expenses (QRE) under IRC Section
            41, having real-time access to precedent-setting rulings allows
            taxpayers to keep up with how courts interpret critical
            benchmarks&mdash;such as the four-part test, funded research
            rules, and documentation standards.
          </p>
          <p>
            Beyond simply archiving court filings, rdtaxcases.com pairs each
            decision with practical expert commentary. These breakdowns
            translate complex judicial opinions into actionable insights,
            helping tax professionals understand how specific court outcomes
            might impact active claims, substantiation strategies, or
            potential audit risks. Whether evaluating state-specific
            incentive nuances or overarching federal Tax Court precedents,
            the site serves as an essential intelligence tool for keeping
            R&amp;D claims audit-ready and defensible.
          </p>
        </div>
      </section>
    </div>
  );
}
