"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";
import { countries } from "@/data/countries";

const LIVE_OPTIONS = [
  { value: "/usa/states", label: "USA (States)" },
  { value: "/usa/federal", label: "USA (Federal)" },
  ...[...countries]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ value: `/${c.slug}`, label: c.name })),
];

export function CountryDropdown() {
  const router = useRouter();
  const selectId = useId();

  return (
    <div className="flex w-full flex-col gap-1 sm:w-auto">
      <label htmlFor={selectId} className="sr-only">
        Select a jurisdiction
      </label>
      <select
        id={selectId}
        defaultValue="/usa/federal"
        onChange={(e) => {
          const value = e.target.value;
          if (value) router.push(value);
        }}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 sm:w-auto sm:min-w-[220px]"
      >
        <optgroup label="Available now">
          {LIVE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
