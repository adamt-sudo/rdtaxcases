import { swansonReedContact } from "@/data/contact";

export const metadata = {
  title: "Contact | RDTAXCASES.com",
  description:
    "Get in touch with the Swanson Reed team behind RDTAXCASES.com.",
};

export default function ContactPage() {
  const { addressLines, phone, phoneHref, email, bookACallUrl } =
    swansonReedContact;

  return (
    <div className="flex flex-col">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Contact
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Talk to the Swanson Reed team
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
            Questions about a case on this site, or about your own R&amp;D
            tax credit claim? Reach out below, or book time directly with a
            specialist.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Office
            </h2>
            <address className="mt-3 not-italic leading-relaxed text-slate-700">
              Swanson Reed
              <br />
              {addressLines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
              United States
            </address>
          </div>

          <div className="rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Direct
            </h2>
            <dl className="mt-3 space-y-2 text-slate-700">
              <div>
                <dt className="inline font-medium">Phone: </dt>
                <dd className="inline">
                  <a href={phoneHref} className="text-blue-700 hover:underline">
                    {phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="inline font-medium">Email: </dt>
                <dd className="inline">
                  <a
                    href={`mailto:${email}`}
                    className="text-blue-700 hover:underline"
                  >
                    {email}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-10 rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Prefer to talk it through?
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Book a call directly with a Swanson Reed R&amp;D tax credit
            specialist.
          </p>
          <a
            href={bookACallUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
          >
            Book a Call
          </a>
        </div>
      </section>
    </div>
  );
}
