"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";
import { usStateJurisdictions } from "@/data/jurisdictions";
import { getCasesForJurisdiction } from "@/data/cases";

/**
 * All 50 states are always present as options, including states with zero
 * published cases — selecting one navigates to that state's page, which
 * renders CaseList's "no cases yet" empty state rather than removing the
 * state from navigation.
 */
export function StateDropdown() {
  const router = useRouter();
  const selectId = useId();

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="sr-only">
        Jump to a state
      </label>
      <select
        id={selectId}
        defaultValue=""
        onChange={(e) => {
          const value = e.target.value;
          if (value) router.push(value);
        }}
        className="w-full min-w-[220px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
      >
        <option value="" disabled>
          Jump to a state…
        </option>
        {usStateJurisdictions.map((state) => {
          const count = getCasesForJurisdiction("usa-states", state.slug).length;
          return (
            <option key={state.slug} value={`/usa/states/${state.slug}`}>
              {state.name} ({count})
            </option>
          );
        })}
      </select>
    </div>
  );
}
