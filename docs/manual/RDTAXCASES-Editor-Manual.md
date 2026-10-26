# Adding, editing and removing cases on RDTAXCASES.com

A short guide for the team. It covers the case editor at
`rdtaxcases.com/admin`. It replaces the "Step 7: Handing it off" part of the
older guide: you no longer send a template to a developer, you use the
editor.

## 1. Who does what

- **Editors** add and change cases. Their work is saved as a **draft**.
  Nothing an editor does goes live by itself.
- **Publishers** (the site owner and the reviewer) read each draft against
  the official decision and publish it.
- **The reviewer** is the only person who marks an English translation as
  reviewed.

> **Publishing in the editor does not change the live website.** Publish
> saves the change in the repository. The live website only changes when the
> developer deploys it. Until then, everything below happens in the editor and
> on GitHub only.

## 2. The rules

1. **Only real cases.** A case may be added only if it is marked REAL on the
   client's sheet. Never add a case marked FAKE, and never cite one.
2. **The decision comes first.** The page is about what the decision says:
   the court, the number, the date, the parties, the outcome, the facts, what
   the court held and why. Put nothing on the page that the decision does not
   contain. A report from the sheet may be used as a draft to cut down, never
   as a source.
3. **Quotation marks only for the court's exact words.**
4. **The decision's language decides the page's language.** If the decision
   is in Italian, the page is in Italian. The English text is a translation of
   that page (section 8).
5. **No PDFs.** The site does not publish PDFs. Do not upload or attach a
   decision. Give the official page of the decision in **Source link** where
   there is one, and keep the decision itself for the publisher's check.
6. **No reference list ("Works cited", "References") and no footnote
   markers** on the page, and no `[cite: n]` markers.
7. **Split the text into blocks.** Headings, paragraphs, lists and tables,
   not the whole report in one paragraph.
8. **No invented facts.** If you are unsure, leave it out and ask.

## 3. Signing in

Go to `rdtaxcases.com/admin` and choose **Login with GitHub**. Use your own
GitHub account (never share one). Turn on 2-step verification on it.

## 4. Adding a case

1. Open the right list (USA federal, USA state or Country) and choose
   **New case**.
2. Fill in the fields.
   - **Slug**: the web address, lowercase letters, numbers and hyphens, for
     example `it-cgt-verona-265-2024`. It cannot be changed after saving.
   - **Title, case number, court, year, decision date, parties, outcome**:
     as the decision states them. Anonymised names stay as printed. For a
     country case the court and the two-letter country code are required.
   - **Section / State / Country**: choose from the list.
   - **Language of the page text**: its code (it, de, es, ...). Leave empty
     for English.
   - **Source link**: the official page of the decision where there is one.
     Leave it empty if there is none (never type "N/A").
   - **Where the text comes from**: name the official site or database the
     decision was read at.
   - **Summary**: two to four sentences, from the decision.
   - **Case text**: build the page from blocks: heading, subheading,
     paragraph, list, table.
3. Choose **Save** and then **Set status** to *In review*. Tell a publisher.

New cases start as **Draft**.

## 5. Editing a case

Open the case, change it, save, set *In review*. The live page stays as it was
until a publisher publishes the change and the developer next deploys the site.
Changing an old case does not hold you responsible for what was already on it,
but you may not add a reference list, a footnote marker or a `[cite: n]`
marker.

## 6. Taking a case off the site

- **Withdraw** it: set **Publication state** to *Withdrawn*, save, send for
  review. The case is kept but the page, the listing entry, the search entry
  and the sitemap entry disappear once the site is next deployed. This is the
  normal way and can be undone.
- **Delete** it only if it must not exist at all. Once the site is next
  deployed, the web address stops working.

## 7. What the automatic check tells you

Every change is checked before it can be published. If it fails, the change
cannot be published until it is fixed. The check looks at the form of the
case, not at the decision's wording.

| Message | What to do |
|---|---|
| "The field ... is empty" / "is missing" | Fill in the field named. |
| "source link ... is not a web address" | Put the official web address, or leave the field empty. |
| "is or holds a 'Works cited' section" | Delete the reference list. |
| "has a [cite: n] marker" | Delete the marker. |
| "is one block of ... characters" | Split the text into headings, paragraphs, lists and tables. |
| "A PDF is attached" / "A PDF was added" | Remove it: the site does not publish PDFs. |
| "footnote numbers stuck to a word" (notice) | Delete the numbers stuck to the end of words, like `1997)3`. |
| "The summary is long" (notice) | Cut it to two to four sentences. |
| "The decision date is empty" (notice) | Fill it in if the decision states it. |

## 8. English translations (reviewer)

The English text lives in its own list, **English translations**, one entry
per case, block for block with the case text. It is shown on the page under
the exact label *English translation, machine-assisted, under review* until
the reviewer ticks **Reviewed**; then the label reads *English translation*.
Do not change the label wording, and nobody but the reviewer ticks
**Reviewed**.

## 9. The publisher's checklist

Open the official decision beside the page.

1. It is the decision named, not another case.
2. It is an official copy, or the source is named.
3. It is about the R&D credit (or the incentive the page says).
4. Court, number, date, parties and outcome match the decision's first page
   and ruling.
5. Every statement about what the court held or reasoned is in the decision.
   Quotation marks surround only the court's exact words.
6. No case marked FAKE is cited. No reference list, no footnote markers.
7. If the page is not in English, the translation has been seen by the
   reviewer.

The automatic check no longer compares numbers and quotations with a PDF, so
points 4 and 5 are done by the publisher.

Then use **Publish**. This saves the change in the repository. The live
website does not change until the developer deploys it.

## 10. If something goes wrong

- You cannot sign in: ask the site owner to check that your GitHub account has been
  added.
- A draft cannot be published: read the check's message (section 7).
- A published page is wrong: set it to *Withdrawn* at once, tell the developer
  (the live page changes only when the developer deploys), then correct it.
- Anything else: tell the developer, with the address of the page.
