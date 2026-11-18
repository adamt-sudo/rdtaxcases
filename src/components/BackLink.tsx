"use client";

import { useSyncExternalStore } from "react";
import { backPathFromReferrer } from "@/lib/back-target.mjs";
import { titleOfPath } from "@/lib/page-titles";
import { absoluteHref } from "@/lib/urls";

// What the browser knows and the server does not: where the visitor came from, and where the page is shown.
// The server (and the first render in the browser) uses "", so the HTML is the plain link to the list page.
const subscribe = () => () => {};
const browserSnapshot = () => [document.referrer, window.location.origin, window.location.hostname, window.location.pathname].join("\n");
const serverSnapshot = () => "";

/**
 * The "Back" button at the top of a glossary, FAQ, legislation or case page.
 *
 * Without JavaScript it is a plain link to the list page of the page's type (fallbackHref), written in the HTML:
 * "← Back to Glossary". With JavaScript, when the visitor came from a page of this site, it goes back to that page and
 * names it: "← Back to Kollsman Instrument Corp. v. Commissioner". It stays in the same tab.
 * prefix is the words before the name ("Back to "); a page in another language passes its own.
 */
export function BackLink({
  fallbackHref,
  fallbackName,
  prefix = "Back to ",
}: {
  fallbackHref: string;
  fallbackName: string;
  prefix?: string;
}) {
  const snapshot = useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);
  let href = absoluteHref(fallbackHref);
  let label = `${prefix}${fallbackName}`;
  if (snapshot) {
    const [referrer, origin, hostname, pathname] = snapshot.split("\n");
    const path = backPathFromReferrer(referrer, { hostname, pathname });
    if (path) {
      const title = titleOfPath(path);
      // the host of the link is the one the visitor is on now (rdtaxcases.com, or a preview of the site)
      href = `${origin}${path}`;
      label = title ? `${prefix}${title}` : `${prefix}the previous page`;
    }
  }

  return (
    <nav aria-label="Back" data-back className="mb-6">
      <a
        href={href}
        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      >
        <span aria-hidden="true">&larr;</span>
        <span>{label}</span>
      </a>
    </nav>
  );
}
