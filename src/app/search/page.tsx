import { cases } from "@/data/cases";
import { CaseSearch } from "@/components/CaseSearch";

export const metadata = {
  title: "Search Cases | RDTAXCASES.com",
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Search Cases</h1>
      <p className="mt-2 text-sm text-slate-600">
        Search by title, case number, year, or subject.
      </p>
      <div className="mt-8">
        <CaseSearch cases={cases} />
      </div>
    </div>
  );
}
