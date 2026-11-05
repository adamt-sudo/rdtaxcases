// Build switch: NEXT_PUBLIC_HIDE_COUNTRY_PAGES=1 builds the site without any country page, country case
// page or country entry in the jurisdiction menu (the US pages are unchanged). It lets the US
// restructure go live before the country pages do. The pull-request workflow builds without it.
// (The NEXT_PUBLIC_ prefix makes the value part of the browser code too, so the menu agrees.)
export const COUNTRIES_LIVE = process.env.NEXT_PUBLIC_HIDE_COUNTRY_PAGES !== "1";
