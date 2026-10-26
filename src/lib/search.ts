import { CaseRecord } from "@/types/case";

export interface CaseSearchFilters {
  query?: string;
  caseNumber?: string;
  year?: number;
  subject?: string;
}

export function searchCases(
  cases: CaseRecord[],
  filters: CaseSearchFilters
): CaseRecord[] {
  const query = filters.query?.trim().toLowerCase();
  const caseNumber = filters.caseNumber?.trim().toLowerCase();
  const subject = filters.subject?.trim().toLowerCase();

  return cases.filter((c) => {
    if (query) {
      const haystack = `${c.title} ${c.articleTitle ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (caseNumber && !c.caseNumber.toLowerCase().includes(caseNumber)) {
      return false;
    }
    if (filters.year && c.year !== filters.year) return false;
    if (subject && c.subject.toLowerCase() !== subject) return false;
    return true;
  });
}

export function getDistinctSubjects(cases: CaseRecord[]): string[] {
  return [...new Set(cases.map((c) => c.subject))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function getDistinctYears(cases: CaseRecord[]): number[] {
  return [...new Set(cases.map((c) => c.year))].sort((a, b) => b - a);
}
