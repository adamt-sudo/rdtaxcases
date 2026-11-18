import { SiteLink } from "@/components/SiteLink";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-10 text-sm text-slate-600 sm:pb-10">
        <nav aria-label="Footer" className="mb-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 font-medium">
            <li>
              <SiteLink href="/us/glossary" className="underline underline-offset-2 hover:text-slate-900">
                Glossary
              </SiteLink>
            </li>
            <li>
              <SiteLink href="/us/faq" className="underline underline-offset-2 hover:text-slate-900">
                FAQ
              </SiteLink>
            </li>
            <li>
              <SiteLink href="/us/legislation" className="underline underline-offset-2 hover:text-slate-900">
                Legislation
              </SiteLink>
            </li>
          </ul>
        </nav>
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
