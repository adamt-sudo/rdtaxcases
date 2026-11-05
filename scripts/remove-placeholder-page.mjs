// Runs after `next build` (package.json "postbuild"). While no country case is published, the
// country case route builds one stand-in page (xx/none) because a static export needs at least one
// path (see src/app/[country]/[slug]/page.tsx). It is not a real page: take it out of the build.
import fs from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "out");
const target = path.join(out, "xx");
if (fs.existsSync(target)) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.rmSync(path.join(out, "xx.html"), { force: true });
  fs.rmSync(path.join(out, "xx.txt"), { force: true });
  console.log("removed the stand-in page out/xx");
}
