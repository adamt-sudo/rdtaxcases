import { Fragment, type ReactNode } from "react";
import { CaseContentBlock } from "@/types/case";
import { InlineText } from "@/components/InlineText";
import { plainText } from "@/lib/inline-core.mjs";

export function CaseBody({
  blocks,
  afterFirstParagraph,
}: {
  blocks: CaseContentBlock[];
  /** Shown once, right after the first paragraph of the text. */
  afterFirstParagraph?: ReactNode;
}) {
  const firstParagraph = blocks.findIndex((b) => b.type === "paragraph");
  return (
    <div className="mt-8 space-y-5 text-slate-800">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={i}
                className="pt-4 text-xl font-bold text-slate-900 first:pt-0"
              >
                {plainText(block.text)}
              </h2>
            );
          case "subheading":
            return (
              <h3 key={i} className="pt-2 text-base font-semibold text-slate-900">
                {plainText(block.text)}
              </h3>
            );
          case "paragraph":
            return (
              <Fragment key={i}>
                <p className="leading-relaxed">
                  <InlineText text={block.text} />
                </p>
                {i === firstParagraph && afterFirstParagraph}
              </Fragment>
            );
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List key={i} className={`${block.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-6 leading-relaxed`}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <InlineText text={item} />
                  </li>
                ))}
              </List>
            );
          }
          case "table":
            return (
              <figure key={i} className="overflow-x-auto">
                {block.caption && (
                  <figcaption className="mb-2 text-sm font-semibold text-slate-700">
                    {block.caption}
                  </figcaption>
                )}
                <table className="w-full min-w-[480px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      {block.headers.map((h, j) => (
                        <th
                          key={j}
                          className="px-3 py-2 text-left font-semibold text-slate-700"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={j} className="border-b border-slate-100">
                        {row.map((cell, k) => (
                          <td key={k} className="px-3 py-2 align-top text-slate-600">
                            <InlineText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
