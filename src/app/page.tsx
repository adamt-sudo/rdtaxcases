import Link from "next/link";
import { usStateJurisdictions, usFederalJurisdiction } from "@/data/jurisdictions";
import { cases } from "@/data/cases";

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            International R&amp;D Tax Credit Case Law Database
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            The most extensive database of international R&amp;D tax credit
            cases on the internet, a Swanson Reed database.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/usa/states"
              className="rounded-md bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
            >
              Browse USA States
            </Link>
            <Link
              href="/usa/federal"
              className="rounded-md border border-blue-700 px-6 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              Browse USA Federal
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="text-xl font-semibold text-slate-900">
          United States
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          {usStateJurisdictions.length} states plus the federal jurisdiction,
          featuring {cases.length} published case write-up
          {cases.length === 1 ? "" : "s"} drawn from real, verified R&amp;D
          tax credit decisions, with more added on an ongoing basis.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Link
            href="/usa/states"
            className="rounded-lg border border-slate-200 p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              USA States
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              All 50 states, each with a dedicated section for state-level
              R&amp;D tax credit case law.
            </p>
          </Link>
          <Link
            href="/usa/federal"
            className="rounded-lg border border-slate-200 p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {usFederalJurisdiction.name}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Federal R&amp;D tax credit cases (U.S. Tax Court, Court of
              Federal Claims, and federal appellate decisions).
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
