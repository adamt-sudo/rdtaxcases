const CONTACT_EMAIL = "info@swansonreed.com";

export const metadata = {
  title: "Copyright Notice | RDTAXCASES.com",
  description:
    "Copyright notice and DMCA policy for RDTAXCASES.com, published by SR Tax Services LLC (Swanson Reed): what is protected, what is not, and the rules on copying and bulk reuse.",
};

const DMCA_AGENT_EMAIL = "Clj@swansonreed.com";

function MailLink({ address }: { address: string }) {
  return (
    <a
      href={`mailto:${address}`}
      className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
    >
      {address}
    </a>
  );
}

function Mail() {
  return <MailLink address={CONTACT_EMAIL} />;
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
            Last updated 29 October 2026
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="space-y-6 text-base leading-relaxed text-slate-700">
          <h2 className="text-xl font-semibold text-slate-900">
            Who publishes this site
          </h2>
          <p>
            RDTAXCASES.com is published by SR Tax Services LLC (Swanson Reed).
          </p>

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
            DMCA / Copyright Policy
          </h2>

          <h3 className="text-lg font-semibold text-slate-900">
            1. Designated Agent Contact Information
          </h3>
          <p>
            If you believe that your copyrighted work has been copied in a way
            that constitutes copyright infringement and is accessible via this
            Service, please notify our Designated Copyright Agent.
          </p>
          <p>
            As required by the Digital Millennium Copyright Act (DMCA), 17
            U.S.C. § 512, our Designated Agent can be reached at:
          </p>
          <dl className="space-y-1">
            <div>
              <dt className="inline font-semibold">Service Provider: </dt>
              <dd className="inline">SR Tax Services LLC</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Designated Agent: </dt>
              <dd className="inline">Cherie Jones</dd>
            </div>
            <div>
              <dt className="inline font-semibold">
                Agent&apos;s Organization:{" "}
              </dt>
              <dd className="inline">SR Tax Services LLC</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Physical Address: </dt>
              <dd className="inline">
                1120 South Freeway, Suite 123C, Fort Worth, TX 76104
              </dd>
            </div>
            <div>
              <dt className="inline font-semibold">Phone Number: </dt>
              <dd className="inline">512.333.2076</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Email Address: </dt>
              <dd className="inline">
                <MailLink address={DMCA_AGENT_EMAIL} />
              </dd>
            </div>
          </dl>

          <h3 className="text-lg font-semibold text-slate-900">
            2. DMCA Takedown Notice Requirements
          </h3>
          <p>
            For your complaint to be valid under the DMCA, you must provide the
            following information in writing:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              An electronic or physical signature of a person authorized to act
              on behalf of the copyright owner.
            </li>
            <li>
              Identification of the copyrighted work that you claim has been
              infringed.
            </li>
            <li>
              Identification of the material that is claimed to be infringing
              and where it is located on the Service.
            </li>
            <li>
              Information reasonably sufficient to permit us to contact you,
              such as your address, telephone number, and email address.
            </li>
            <li>
              A statement that you have a good faith belief that use of the
              material in the manner complained of is not authorized by the
              copyright owner, its agent, or law.
            </li>
            <li>
              A statement, made under penalty of perjury, that the above
              information is accurate, and that you are the copyright owner or
              are authorized to act on behalf of the owner.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-slate-900">
            3. Repeat Infringer Policy
          </h3>
          <p>
            In accordance with the DMCA and other applicable law, it is the
            policy of the Service Provider, in appropriate circumstances, to
            terminate the accounts or access of users who are deemed to be
            repeat copyright infringers.
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
