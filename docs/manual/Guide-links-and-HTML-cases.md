# Links and emphasis in case text: a short guide

Written 2026-10-28 for the reviewer and the editors. It adds to the editor manual
(`RDTAXCASES-Editor-Manual.md`). Nothing here changes how a case is published:
saving in the editor never changes the live website until the developer deploys.

## 1. What is new

A paragraph, a list item or a table cell can now hold:

- **links** to pages on swansonreed.com (for example the glossary or legislation
  pages) and on rdtaxcases.com,
- *italic* words (for case names), and
- **bold** words.

Nothing else is allowed: no other websites, no pictures, no colours.

## 2. How to add a link in the editor

1. Open the case, then the block (a paragraph, a list item or a table cell) in
   **Case text**.
2. Type or paste this around the words that should be the link:

   `<a href="https://www.swansonreed.com/research-tax-credit/federal/glossary/section-41/">IRC Section 41</a>`

   The address goes inside the quotation marks. The words the reader sees go
   between `>` and `</a>`.
3. For italics type `<em>words</em>`. For bold type `<strong>words</strong>`.
4. Press **Preview** (the eye icon). The case appears with its real links. A
   box at the top says "Text markup is fine" or lists what is wrong.
5. Save and set the status to *In review*, as usual.

Copy the address from your browser's address bar while you are on the
swansonreed.com page, so it is exact.

## 3. The rules

- Links go **only** to swansonreed.com and rdtaxcases.com. A link to any other
  website is refused.
- Do not use links or bold or italics in **headings**, the **title**, the
  **summary**, **table column headings** or captions. Use them only in
  paragraphs, list items and table cells.
- To write a "less than" sign type `&lt;`. Do not type any other tag.
- Write every opening tag with its closing tag (`<em>` ... `</em>`).

## 4. What the automatic check says

| Message | What to do |
|---|---|
| "the link to ... is not allowed" | The address is not on swansonreed.com or rdtaxcases.com: use a swansonreed.com address, or remove the link and keep the words. |
| "... is never closed" / "has no matching opening tag" | A tag is missing its pair: add the missing `</a>`, `</em>` or `</strong>`. |
| "has a link or emphasis tag" | You used a tag in a heading, the title, the summary or a column heading: take it out there. |
| "The link ... is broken (404)" | The page does not exist: correct the address or remove the link. |
| "The link ... redirects to ..." (notice) | Use the new address it shows. |
| "could not be checked" (notice) | The other site was slow: open the link yourself. If it opens, you can ignore the notice. |

## 5. Cases that come as an HTML Google Doc

The new cases are written as HTML in a Google Doc (one doc per case). You do not
type the links again.

1. Send the developer the Google Doc link (the document must be shared so that
   anyone with the link can view it).
2. The developer imports it: headings, paragraphs, tables and all the links
   come across, and the developer tells you how many blocks and links were found
   and whether every link opens.
3. You open the case in the editor, press **Preview**, read it, and click a few
   of the links.
4. If a link is wrong, fix it in the editor (section 2). If something is missing,
   tell the developer.

## 6. Before you set a case to *In review*

- The Preview box says "Text markup is fine".
- You have clicked a few of the links and they open the right page.
- There is no list of references at the end ("Works cited"), and no footnote
  numbers stuck to the words.
