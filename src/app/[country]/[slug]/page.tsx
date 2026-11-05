import { notFound } from "next/navigation";
import { getCaseForCountry, getCountryCases } from "@/data/cases";
import { CasePage, caseMetadata } from "@/components/CasePage";

type Params = { country: string; slug: string };

export const dynamicParams = false;

export function generateStaticParams() {
  const params = getCountryCases().map((c) => ({ country: c.jurisdictionSlug, slug: c.slug }));
  // A static export needs at least one path. While no country case is published this one
  // stands in: it renders the not-found page and is never linked, listed or put in the sitemap.
  return params.length ? params : [{ country: "xx", slug: "none" }];
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { country, slug } = await params;
  return caseMetadata(getCaseForCountry(country, slug));
}

export default async function CountryCasePage({ params }: { params: Promise<Params> }) {
  const { country, slug } = await params;
  const caseRecord = getCaseForCountry(country, slug);
  if (!caseRecord) notFound();
  return <CasePage caseRecord={caseRecord} />;
}
