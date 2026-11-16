// A meta description (at most 155 characters) made from a page's answer capsule, without adding anything:
//   1. the first sentence, when it fits;
//   2. else the first sentence cut at its last strong break (; : —) that leaves at least 70 characters;
//   3. else cut at the last word that fits, with an ellipsis.
// The method used is returned so the importer can report how many descriptions were cut.
export const MAX_DESCRIPTION = 155;
const ABBREVIATIONS = /\b(?:Memo|Mem|Op|Order|Rev|Proc|Rul|Ann|Notice|U\.S|U\.S\.C|Inc|Corp|Co|Ltd|No|Nos|v|vs|e\.g|i\.e|Sec|Fed|Cir|Supp|Cl|T\.C|Ct|Dist|Comm'r|St|Mr|Mrs|Dr|Pub|L|Reg|Treas|Prop|approx|etc|al|C\.F\.R|I\.R\.C|F\.2d|F\.3d|F\.4th|Ohio|Mass|Fla|Cal|Tex|Ill|Pa|Va|Md|Mich|Minn|Wis|Ind|Okla|Wash|Ariz|Colo|Conn|Tenn|N\.Y|N\.J|N\.D|S\.D|W\.D|E\.D|M\.D|D|R&D)\.$/;

export function firstSentence(text) {
  const re = /[.!?]["”’)]?\s+(?=["“‘(]?[A-Z0-9§])/g;
  let m;
  while ((m = re.exec(text))) {
    const head = text.slice(0, m.index + 1);
    if (/[.]$/.test(head) && (ABBREVIATIONS.test(head) || /\b[A-Z]\.$/.test(head))) continue;
    return text.slice(0, m.index + m[0].trimEnd().length);
  }
  return text;
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function makeDescription(capsule, max = MAX_DESCRIPTION, title = "") {
  const text = String(capsule).replace(/\s+/g, " ").trim();
  if (!text) return { text: "", method: "none" };
  // a very short opening ("Yes."), or one that only repeats the question, is joined with the next sentence
  let first = firstSentence(text);
  const isQuestion = (s) => /\?$/.test(s) || (title && norm(s) === norm(title));
  let guard = 0;
  while ((first.length < 60 || isQuestion(first)) && first.length < text.length && guard++ < 4) {
    const next = firstSentence(text.slice(first.length).trimStart());
    if (!next) break;
    first = first + " " + next;
  }
  if (first.length <= max) return { text: first, method: "first sentence" };
  const head = first.slice(0, max);
  // a strong break (; : —) that leaves a long enough clause; a comma is not strong enough (it would leave a list half done)
  for (const sep of [";", ":", " —"]) {
    const i = head.lastIndexOf(sep);
    if (i >= 70) {
      const cut = head.slice(0, i).replace(/[\s,;:—-]+$/, "");
      return { text: cut + ".", method: "clause" };
    }
  }
  const sp = head.slice(0, max - 1).lastIndexOf(" ");
  return { text: head.slice(0, sp > 0 ? sp : max - 1).replace(/[\s,;:—-]+$/, "") + "…", method: "words" };
}
