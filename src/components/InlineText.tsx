import type { ReactNode } from "react";
import { parseInline, type InlineNode } from "@/lib/inline-core.mjs";

const LINK =
  "text-blue-700 underline underline-offset-2 hover:text-blue-900 focus-visible:outline focus-visible:outline-2";

function render(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((n, i) => {
    if (n.t === "text") return n.s;
    if (n.t === "em") return <em key={i}>{render(n.c)}</em>;
    if (n.t === "strong") return <strong key={i}>{render(n.c)}</strong>;
    return n.external ? (
      <a key={i} href={n.href} className={LINK} target="_blank" rel="noopener">
        {render(n.c)}
      </a>
    ) : (
      <a key={i} href={n.href} className={LINK}>
        {render(n.c)}
      </a>
    );
  });
}

/** Case text with links and emphasis (see src/lib/inline-core.mjs). Anything not allowed shows as plain text. */
export function InlineText({ text }: { text: string }) {
  return <>{render(parseInline(text).nodes)}</>;
}
