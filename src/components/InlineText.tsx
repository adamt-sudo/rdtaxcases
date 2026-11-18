import type { ReactNode } from "react";
import { absoluteHref } from "@/lib/urls";
import { isKnownAddress } from "@/lib/known-addresses";
import { parseInline, type InlineNode } from "@/lib/inline-core.mjs";

const LINK =
  "text-blue-700 underline underline-offset-2 hover:text-blue-900 focus-visible:outline focus-visible:outline-2";

function render(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((n, i) => {
    if (n.t === "text") return n.s;
    if (n.t === "em") return <em key={i}>{render(n.c)}</em>;
    if (n.t === "strong") return <strong key={i}>{render(n.c)}</strong>;
    if (n.t === "sub") return <sub key={i}>{render(n.c)}</sub>;
    if (n.t === "sup") return <sup key={i}>{render(n.c)}</sup>;
    // a link to a page of this site that does not exist yet is plain text until the page is added
    if (!n.external && n.href.startsWith("/") && !isKnownAddress(n.href)) return <span key={i}>{render(n.c)}</span>;
    // every link in the content opens in a new tab, this site's own pages and other sites alike
    return (
      <a key={i} href={absoluteHref(n.href)} className={LINK} target="_blank" rel="noopener">
        {render(n.c)}
      </a>
    );
  });
}

/** Case text with links and emphasis (see src/lib/inline-core.mjs). Anything not allowed shows as plain text. */
export function InlineText({ text }: { text: string }) {
  return <>{render(parseInline(text).nodes)}</>;
}
