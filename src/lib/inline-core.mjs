// Inline markup in case text: links and emphasis, stored as a small, fixed set of
// HTML tags inside the text fields of paragraphs, list items and table cells:
//
//   <a href="https://www.swansonreed.com/...">text</a>
//   <em>text</em>   <strong>text</strong>   (<i> and <b> are read as the same)
//
// Nothing else is markup. A `<` that does not start one of these tags is plain
// text. The three entities &lt; &gt; &amp; are decoded (a literal "<" in the
// text is written &lt;); every other "&" is just an ampersand ("R&D").
//
// This one file is the single source: the site renders with it (src/components/
// InlineText.tsx), the format check validates with it (scripts/), the importer
// writes with it, and the editor preview is generated from it
// (scripts/build-admin-config.mjs). It has no dependencies.

/** Hosts a link may point to (besides this site's own relative paths). */
export const ALLOWED_HOSTS = ["swansonreed.com", "www.swansonreed.com", "rdtaxcases.com", "www.rdtaxcases.com"];

const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^<>]*?)?)\s*(\/?)>/g;
const ALIAS = { a: "a", em: "em", i: "em", strong: "strong", b: "strong" };

/** A link target the site accepts: https on an allowed host, or a path on this site. Otherwise null. */
export function safeHref(href) {
  const h = String(href ?? "").trim();
  if (/^\/(?!\/)[^\s]*$/.test(h)) return h; // a path on this site
  let u;
  try {
    u = new URL(h);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password) return null;
  return ALLOWED_HOSTS.includes(u.hostname.toLowerCase()) ? u.href : null;
}

/** True when the link goes to another site (so it opens in a new tab). */
export function isExternal(href) {
  return !href.startsWith("/") && !/^https:\/\/(www\.)?rdtaxcases\.com(\/|$)/i.test(href);
}

export function decodeEntities(s) {
  return s.replace(/&(lt|gt|amp);/g, (_, n) => ({ lt: "<", gt: ">", amp: "&" })[n]);
}

/** Escape text for storing (the importer): only < and > (and an & that would read as an entity). */
export function encodeText(s) {
  return s.replace(/&(?=(lt|gt|amp);)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function hrefOf(attrs) {
  const m = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  return m ? (m[1] ?? m[2]) : null;
}

/**
 * Parse a stored string. Returns { nodes, problems }.
 * Nodes: { t: "text", s } | { t: "em" | "strong", c: nodes } | { t: "a", href, external, c: nodes }.
 * A tag that is not allowed, a link to a host that is not allowed, or an unbalanced tag becomes plain
 * text in the nodes and is listed in problems (for the format check).
 */
export function parseInline(src) {
  const problems = [];
  const root = { c: [] };
  const stack = [root];
  const cur = () => stack[stack.length - 1];
  const text = (s) => {
    if (!s) return;
    const c = cur().c;
    const last = c[c.length - 1];
    if (last && last.t === "text") last.s += s;
    else c.push({ t: "text", s });
  };
  let pos = 0;
  for (const m of src.matchAll(TAG)) {
    const [whole, close, rawName, attrs] = m;
    text(decodeEntities(src.slice(pos, m.index)));
    pos = m.index + whole.length;
    const name = rawName.toLowerCase();
    const kind = ALIAS[name];
    if (!kind) {
      problems.push(`the tag <${rawName}> is not allowed`);
      continue; // dropped; its inner text stays
    }
    if (close) {
      const top = cur();
      if (stack.length > 1 && top.t === kind) {
        stack.pop();
        cur().c.push(top.node ?? top);
      } else {
        problems.push(`</${rawName}> has no matching opening tag`);
      }
      continue;
    }
    if (kind === "a") {
      const raw = hrefOf(attrs);
      const href = raw === null ? null : safeHref(raw);
      if (raw === null) problems.push("a link has no href");
      else if (href === null) problems.push(`the link to ${raw.slice(0, 60)} is not allowed (only swansonreed.com and rdtaxcases.com)`);
      const rest = attrs.replace(/\bhref\s*=\s*(?:"[^"]*"|'[^']*')/i, "").replace(/\b(target|rel)\s*=\s*(?:"[^"]*"|'[^']*')/gi, "").trim();
      if (rest) problems.push(`a link has attributes that are not allowed (${rest.slice(0, 40)})`);
      stack.push({ t: "a", href, external: href ? isExternal(href) : false, c: [] });
    } else {
      stack.push({ t: kind, c: [] });
    }
  }
  text(decodeEntities(src.slice(pos)));
  // tags left open: close them and report
  while (stack.length > 1) {
    const top = stack.pop();
    problems.push(`<${top.t === "a" ? "a" : top.t === "em" ? "em" : "strong"}> is never closed`);
    cur().c.push(top);
  }
  // a link without an allowed target is shown as its text only
  const clean = (nodes) =>
    nodes.flatMap((n) => {
      if (n.t === "text") return [n];
      const c = clean(n.c);
      if (n.t === "a" && !n.href) return c;
      return [{ ...n, c }];
    });
  return { nodes: clean(root.c), problems };
}

/** The text without markup (search, descriptions, structured data). */
export function plainText(src) {
  const walk = (nodes) => nodes.map((n) => (n.t === "text" ? n.s : walk(n.c))).join("");
  return walk(parseInline(String(src)).nodes);
}

/** Every allowed link in a stored string: [{ href, text }]. */
export function linksIn(src) {
  const out = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.t === "a") out.push({ href: n.href, text: walk2(n.c) });
      if (n.t !== "text") walk(n.c);
    }
  };
  const walk2 = (nodes) => nodes.map((n) => (n.t === "text" ? n.s : walk2(n.c))).join("");
  walk(parseInline(String(src)).nodes);
  return out;
}

/** Problems only (for the format check). */
export function inlineProblems(src) {
  return parseInline(String(src)).problems;
}

/** True when the string contains any of our tags (so a heading or the summary should not). */
export function hasMarkup(src) {
  return /<\/?(a|em|i|strong|b)\b/i.test(String(src));
}
