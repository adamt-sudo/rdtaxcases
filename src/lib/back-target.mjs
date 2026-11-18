// Where the "Back" button of a content page goes, decided in the visitor's browser (src/components/BackLink.tsx).
// Without JavaScript the button is a plain link to the list page. With JavaScript, when the visitor came from a page of this
// site, the button goes back to that page. It has no dependencies, so the same function is tested in Node (scripts/test-back-target.mjs).

const OWN_HOST = /^(www\.)?rdtaxcases\.com$/i;

/**
 * @param {string} referrer  document.referrer ("" when there is none)
 * @param {{ hostname: string, pathname: string }} here  window.location (host and path of the current page)
 * @returns {string | null}  the path of the page to go back to (no domain, no query, no trailing slash), or null to keep the list page
 */
export function backPathFromReferrer(referrer, here) {
  if (!referrer) return null;
  let u;
  try {
    u = new URL(referrer);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  // a page of this site: rdtaxcases.com (with or without www), or the host the visitor is on now (a preview or a local copy)
  if (!OWN_HOST.test(u.hostname) && u.hostname !== here.hostname) return null;
  const path = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, "") : u.pathname;
  const clean = (p) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  if (path === clean(here.pathname)) return null; // a reload, or a link to the same page
  if (path === "/admin" || path.startsWith("/admin/") || path.startsWith("/_next/")) return null;
  if (/\.(?:pdf|xml|txt|json|png|jpe?g|svg|ico)$/i.test(path)) return null;
  return path;
}
