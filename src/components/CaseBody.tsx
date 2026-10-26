import { CaseContentBlock } from "@/types/case";

export function CaseBody({ blocks }: { blocks: CaseContentBlock[] }) {
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
                {block.text}
              </h2>
            );
          case "subheading":
            return (
              <h3 key={i} className="pt-2 text-base font-semibold text-slate-900">
                {block.text}
              </h3>
            );
          case "paragraph":
            return (
              <p key={i} className="leading-relaxed">
                {block.text}
              </p>
            );
          case "list":
            return (
              <ul key={i} className="list-disc space-y-2 pl-6 leading-relaxed">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
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
                            {cell}
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
