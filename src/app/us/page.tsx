import { SiteLink } from "@/components/SiteLink";
import { US_FEDERAL, US_STATES } from "@/lib/urls";

export const metadata = {
  alternates: { canonical: "/us" },
  title: "USA R&D Tax Credit Cases | RDTAXCASES.com",
  description:
    "R&D tax credit case law from the United States: federal court decisions and decisions from individual U.S. states.",
};

export default function UsHomePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900">United States</h1>
      <p className="mt-2 text-sm text-slate-600">
        R&amp;D tax credit case law from the United States.
      </p>
      <ul className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200">
        <li>
          <SiteLink href={US_FEDERAL} className="block px-5 py-4 hover:bg-slate-50">
            <span className="font-medium text-slate-900">Federal cases</span>
            <span className="block text-xs text-slate-600">Decisions of the federal courts</span>
          </SiteLink>
        </li>
        <li>
          <SiteLink href={US_STATES} className="block px-5 py-4 hover:bg-slate-50">
            <span className="font-medium text-slate-900">State cases</span>
            <span className="block text-xs text-slate-600">Decisions by state</span>
          </SiteLink>
        </li>
      </ul>
    </div>
  );
}
