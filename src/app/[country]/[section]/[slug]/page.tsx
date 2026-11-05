import { notFound } from "next/navigation";
import { getBuiltPages, getPage } from "@/data/pages";
import { PageView, pageMetadata } from "@/components/PageView";

// Glossary terms, laws and FAQ questions: /[cc]/[section folder]/[page]. A static export needs at least one path,
// so while no such page exists one stand-in (xx/xx/none) is built; scripts/remove-placeholder-page.mjs takes it out.
export const dynamicParams = false;

export function generateStaticParams() {
  const pages = getBuiltPages().map((p) => {
    const [country, section, slug] = p.address.split("/").filter(Boolean);
    return { country, section, slug };
  });
  return pages.length ? pages : [{ country: "xx", section: "xx", slug: "none" }];
}

type Params = Promise<{ country: string; section: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { country, section, slug } = await params;
  return pageMetadata(getPage(country, section, slug));
}

export default async function Page({ params }: { params: Params }) {
  const { country, section, slug } = await params;
  const page = getPage(country, section, slug);
  if (!page) notFound();
  return <PageView page={page} />;
}
