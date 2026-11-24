import { SiteLink } from "@/components/SiteLink";
import { FooterLinks, type FooterCountry } from "@/components/FooterLinks";
import { hubAddress, hubCountries } from "@/components/HubPage";

const KINDS = [
  { kind: "glossary-term", label: "Glossary" },
  { kind: "faq-question", label: "FAQ" },
  { kind: "legislation-page", label: "Legislation" },
] as const;

/** The one place that names how a country is labelled in the footer. A country that is not listed uses its own name. */
const FOOTER_LABEL: Record<string, string> = { us: "USA" };

export function Footer() {
  // every country that has glossary, FAQ or legislation pages: a new country appears here by having pages
  const countries: FooterCountry[] = hubCountries().map((c) => {
    const label = FOOTER_LABEL[c.code] ?? c.name;
    return {
      code: c.code,
      label,
      links: KINDS.map((k) => ({ label: k.label, href: hubAddress(c.code, k.kind), aria: `${label} ${k.label}` })),
    };
  });
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-10 text-sm text-slate-600 sm:pb-10">
        <FooterLinks countries={countries} />
        <p className="max-w-2xl">
          RDTAXCASES.com is the most extensive database of international R&D
          tax credit cases on the internet, a Swanson Reed database.
        </p>
        <p className="mt-4 text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Swanson Reed. All rights reserved.{" "}
          <SiteLink
            href="/copyright"
            className="underline underline-offset-2 hover:text-slate-900"
          >
            Copyright
          </SiteLink>
        </p>
      </div>
    </footer>
  );
}
