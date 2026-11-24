"use client";

import { usePathname } from "next/navigation";
import { SiteLink } from "@/components/SiteLink";

export interface FooterCountry {
  code: string;
  label: string;
  links: { label: string; href: string; aria: string }[];
}

/**
 * The glossary, FAQ and legislation links of the footer. On the pages of a country (/ca, /ca/...) only that country's
 * links are shown; on pages with no country (home, about, search...) every country's links are shown, each labelled.
 * The countries come from the server (every country that has published pages), so a new country needs no change here.
 */
export function FooterLinks({ countries }: { countries: FooterCountry[] }) {
  const pathname = usePathname() ?? "/";
  const first = (pathname.match(/^\/([a-z]{2})(?:\/|$)/) ?? [])[1];
  const own = countries.filter((c) => c.code === first);
  const shown = own.length ? own : countries;
  return (
    <nav aria-label="Footer" className="mb-6" data-footer-links={own.length ? first : "all"}>
      <ul className="space-y-2">
        {shown.map((c) => (
          <li key={c.code} className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <span className="w-36 font-semibold text-slate-800">{c.label}</span>
            <ul className="flex flex-wrap gap-x-6 gap-y-1 font-medium">
              {c.links.map((l) => (
                <li key={l.href}>
                  <SiteLink href={l.href} className="underline underline-offset-2 hover:text-slate-900" aria-label={l.aria}>
                    {l.label}
                  </SiteLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
