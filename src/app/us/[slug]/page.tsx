import { notFound } from "next/navigation";
import { getCaseForUs, getUsCases } from "@/data/cases";
import { CasePage, caseMetadata } from "@/components/CasePage";

export const dynamicParams = false;

export function generateStaticParams() {
  return getUsCases().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return caseMetadata(getCaseForUs(slug));
}

export default async function UsCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caseRecord = getCaseForUs(slug);
  if (!caseRecord) notFound();
  return <CasePage caseRecord={caseRecord} />;
}
