const CONTACT_EMAIL = "info@swansonreed.com";

export const metadata = {
  title: "Copyright Notice | RDTAXCASES.com",
  description:
    "Copyright notice for RDTAXCASES.com, published by Swanson Reed: what is protected, what is not, and the rules on copying and bulk reuse.",
};

function Mail() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
    >
      {CONTACT_EMAIL}
    </a>
  );
}

export default function CopyrightPage() {
  return (
    <div className="flex flex-col">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Legal
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Copyright Notice
          </h1>
          <p className="mt-4 text-sm text-slate-600">
            Last updated 26 October 2026
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="space-y-6 text-base leading-relaxed text-slate-700">
          <h2 className="text-xl font-semibold text-slate-900">
            Who publishes this site
          </h2>
          <p>RDTAXCASES.com is published by Swanson Reed.</p>

          <h2 className="text-xl font-semibold text-slate-900">
            What this notice covers
          </h2>
          <p>
            It covers the material that Swanson Reed writes for this site:
            the case write-ups, summaries, analysis, headings and tables, the
            way the cases are selected and organised, and the site&rsquo;s
            design and code. &copy; 2026 Swanson Reed. All rights reserved.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">
            What it does not cover
          </h2>
          <p>
            It does not cover the court and tribunal decisions that the
            write-ups discuss. Those are public legal documents. They belong
            to the courts and bodies that issued them, and Swanson Reed does
            not claim ownership of them.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">No licence</h2>
          <p>
            Visiting this site grants no licence to the material described
            above. You may read it, and you may link to its pages. Nothing
            else is permitted without written permission.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">
            No copying or derivative works
          </h2>
          <p>
            You may not copy, republish, translate, adapt, paraphrase or
            summarise that material for republication, or build a derivative
            work from it, in whole or in part. Swanson Reed treats rewording
            its write-ups as copying.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">
            Search engines, AI assistants and bulk copying
          </h2>
          <p>
            Search engines and AI assistants may crawl and index this site.
          </p>
          <p>
            Bulk copying, republishing, or building a competing dataset,
            database or service from this site&rsquo;s material is not
            permitted, whether it is done by hand or with automated tools.
            Automated access must respect the site&rsquo;s{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">
              robots.txt
            </code>{" "}
            and must not overload the site.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">
            Reports of infringement (DMCA)
          </h2>
          <p>
            Swanson Reed responds to notices under the US Digital Millennium
            Copyright Act and may send such notices to web hosts and search
            engines. It may also seek the remedies the law allows, including
            injunctions and legal costs. To report a suspected infringement of
            this site&rsquo;s material, write to <Mail /> and give the page
            address, a description of the work, and your contact details.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">
            Permission requests
          </h2>
          <p>
            To ask for written permission, write to <Mail />.
          </p>

          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p>
            <Mail />
          </p>
        </div>
      </section>
    </div>
  );
}
