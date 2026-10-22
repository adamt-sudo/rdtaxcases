"use client";

import { useMemo, useState } from "react";
import { CaseRecord } from "@/types/case";
import { searchCases, getDistinctSubjects, getDistinctYears } from "@/lib/search";
import { CaseList } from "./CaseList";

export function CaseSearch({ cases }: { cases: CaseRecord[] }) {
  const [query, setQuery] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");

  const years = useMemo(() => getDistinctYears(cases), [cases]);
  const subjects = useMemo(() => getDistinctSubjects(cases), [cases]);

  const results = useMemo(
    () =>
      searchCases(cases, {
        query,
        caseNumber,
        year: year ? Number(year) : undefined,
        subject,
      }),
    [cases, query, caseNumber, year, subject]
  );

  const hasActiveFilters = query || caseNumber || year || subject;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs font-medium text-slate-600">
            Title
          </label>
          <input
            id="q"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search case title…"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="caseNumber" className="text-xs font-medium text-slate-600">
            Case number
          </label>
          <input
            id="caseNumber"
            type="text"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            placeholder="e.g. 197 F.2d 442"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="year" className="text-xs font-medium text-slate-600">
            Year
          </label>
          <select
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="subject" className="text-xs font-medium text-slate-600">
            Subject
          </label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {results.length} case{results.length === 1 ? "" : "s"} found
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCaseNumber("");
              setYear("");
              setSubject("");
            }}
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <CaseList cases={results} />
    </div>
  );
}
