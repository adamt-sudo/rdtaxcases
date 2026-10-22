import { notFound } from "next/navigation";
import { usStateJurisdictions } from "@/data/jurisdictions";
import { getCasesForJurisdiction } from "@/data/cases";
import { CaseList } from "@/components/CaseList";

export function generateStaticParams() {
  return usStateJurisdictions.map((state) => ({ state: state.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state: stateSlug } = await params;
  const state = usStateJurisdictions.find((s) => s.slug === stateSlug);
  if (!state) return {};
  return { title: `${state.name} R&D Tax Credit Cases | RDTAXCASES.com` };
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state: stateSlug } = await params;
  const state = usStateJurisdictions.find((s) => s.slug === stateSlug);
  if (!state) notFound();

  const stateCases = getCasesForJurisdiction("usa-states", state.slug);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900">{state.name}</h1>
      <p className="mt-2 text-sm text-slate-600">
        R&amp;D tax credit case law for {state.name}.
      </p>
      <div className="mt-8">
        <CaseList cases={stateCases} />
      </div>
    </div>
  );
}
