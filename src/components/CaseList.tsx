import Link from "next/link";
import { CaseRecord } from "@/types/case";

export function CaseList({ cases }: { cases: CaseRecord[] }) {
  if (cases.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        No cases published for this jurisdiction yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
      {cases.map((c) => (
        <li key={c.slug}>
          <Link
            href={`/cases/${c.slug}`}
            className="flex flex-col gap-1 px-5 py-4 hover:bg-slate-50"
          >
            <span className="font-medium text-slate-900">{c.title}</span>
            <span className="text-xs text-slate-600">
              {c.year} &middot; {c.subject}
              {c.caseNumber !== "TBD" ? ` · Case No. ${c.caseNumber}` : ""}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
