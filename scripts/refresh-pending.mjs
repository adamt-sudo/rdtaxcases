// Rebuild content/pending-pages.json from the content, including pages written in the editor with an HTML body (a link in such
// a page to a page that does not exist yet is shown as plain text and listed here). Run before every build.
//   node scripts/refresh-pending.mjs
import { refreshPending } from "./lib/pending.mjs";

const r = refreshPending({ write: true });
console.log(`pending list: ${r.pending.length} address(es) (${r.added.length} added, ${r.removed.length} removed)`);
