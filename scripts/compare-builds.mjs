// Compare two static-export builds (out/ folders) page by page, ignoring what
// legitimately differs between two builds of the same source: asset hashes,
// the build id, sitemap timestamps and Next's next-size-adjust tag.
// Used as the identical-build proof when the data layout changes.
//
// Usage: node scripts/compare-builds.mjs <out-before> <out-after>
import fs from "fs";
import path from "path";

const [A, B] = process.argv.slice(2);

function walk(d, base = d, acc = []) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p, base, acc);
    else acc.push(path.relative(base, p).split(path.sep).join("/"));
  }
  return acc;
}

// Remove everything that legitimately changes between two builds of the same
// source: asset hashes, the build id, and timestamps in the sitemap.
function norm(buf, rel) {
  if (!/\.(html|txt|xml|json)$/.test(rel)) return buf.toString("base64");
  let s = buf.toString("utf8");
  s = s.replace(/<meta name="next-size-adjust"[^>]*>/g, "");
  s = s.replace(/<lastmod>[^<]*<\/lastmod>/g, "<lastmod/>");
  s = s.replace(/\/_next\/static\/[A-Za-z0-9_\-\/.]+\.(js|css|woff2?)/g, "/_next/static/X");
  s = s.replace(/_next\/static\/[A-Za-z0-9_\-]{10,}\/_(buildManifest|ssgManifest)\.js/g, "_next/static/ID/$1.js");
  s = s.replace(/"b":"[A-Za-z0-9_\-]{10,}"/g, '"b":"ID"');
  s = s.replace(/\\"b\\":\\"[A-Za-z0-9_\-]{10,}\\"/g, '\\"b\\":\\"ID\\"');
  s = s.replace(/buildId["']?\s*[:=]\s*["'][^"']+["']/g, 'buildId:"ID"');
  return s;
}

const fa = new Set(walk(A).filter((f) => !f.startsWith("_next/")));
const fb = new Set(walk(B).filter((f) => !f.startsWith("_next/")));
const onlyA = [...fa].filter((f) => !fb.has(f));
const onlyB = [...fb].filter((f) => !fa.has(f));
const diff = [];
let same = 0;
for (const f of fa) {
  if (!fb.has(f)) continue;
  const a = norm(fs.readFileSync(path.join(A, f)), f);
  const b = norm(fs.readFileSync(path.join(B, f)), f);
  if (a === b) same++;
  else diff.push(f);
}
console.log(
  `files compared: ${same + diff.length}; identical: ${same}; different: ${diff.length}; only before: ${onlyA.length}; only after: ${onlyB.length}`,
);
if (diff.length) console.log("different:", diff.slice(0, 15).join(", "));
if (onlyA.length) console.log("only before:", onlyA.slice(0, 10).join(", "));
if (onlyB.length) console.log("only after:", onlyB.slice(0, 10).join(", "));
