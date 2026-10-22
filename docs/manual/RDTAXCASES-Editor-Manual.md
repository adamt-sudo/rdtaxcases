# Adding, editing and removing cases on RDTAXCASES.com

A short guide for the team. It covers the case editor at
`rdtaxcases.com/admin`. It replaces the "Step 7: Handing it off" part of the
older guide: you no longer send a template to a developer, you use the
editor.

## 1. Who does what

- **Editors** add and change cases. Their work is saved as a **draft**.
  Nothing an editor does goes live by itself.
- **Publishers** (the site owner and the reviewer) read each draft against
  its PDF and publish it.
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
4. **The PDF's language decides the page's language.** If the decision is in
   Italian, the page is in Italian. The English text is a translation of that
   page (section 8).
5. **Attach the decision's PDF.** It must be the decision itself (not an
   opinion or a commentary), as official a copy as exists, and text you can
   select (not a scan). Name it after the case: `<slug>.pdf`.
6. **No reference list and no footnote markers** on the page.
7. **No invented facts.** If you are unsure, leave it out and ask.

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
     as the decision states them. Anonymised names stay as printed.
   - **Section / State / Country**: choose from the list.
   - **Language of the page text**: its code (it, de, es, ...). Leave empty
     for English.
   - **Source link**: the official page of the decision where there is one.
   - **Source PDF**: upload it. **Where the PDF comes from**: name the
     official site or database.
   - **Summary**: two to four sentences, from the decision.
   - **Case text**: build the page from blocks: heading, subheading,
     paragraph, list, table.
3. Choose **Save** and then **Set status** to *In review*. Tell a publisher.

## 5. Editing a case

Open the case, change it, save, set *In review*. The live page stays as it was
until a publisher publishes the change and the developer next deploys the site. Changing an old case does not hold
you responsible for what was already on it, but you may not add a number or a
quoted phrase the decision does not contain.

## 6. Taking a case off the site

- **Withdraw** it: set **Publication state** to *Withdrawn*, save, send for
  review. The case and its PDF are kept but the page, the listing entry, the
  search entry and the sitemap entry disappear once the site is next deployed.
  This is the normal way and can be undone.
- **Delete** it only if it must not exist at all. Deleting removes the case
  file; **also delete its PDF** (the check will remind you). Once the site is
  next deployed, the web address stops working.

## 7. What the automatic check tells you

Every change is checked before it can be published. If it fails, the change
cannot be published until it is fixed.

| Message | What to do |
|---|---|
| "number(s) or quoted phrase(s) are not in the decision" | Remove them, or ask the reviewer to give a written source. |
| "has no readable text (a scan?)" | Get a text version of the decision's PDF. |
| "does not exist in public/" | The PDF is missing: upload it again. |
| "slug does not match the file name" / "is missing" | A required field is empty or wrong: fix it. |
| "no PDF is attached" (notice) | Attach the PDF, or the publisher must check the source by hand. |
| "not used by any case" (notice) | A PDF is no longer used: delete it. |

## 8. English translations (reviewer)

The English text lives in its own list, **English translations**, one entry
per case, block for block with the case text. It is shown on the page under
the exact label *English translation, machine-assisted, under review* until
the reviewer ticks **Reviewed**; then the label reads *English translation*.
Do not change the label wording, and nobody but the reviewer ticks
**Reviewed**.

## 9. The publisher's checklist

Open the PDF beside the page.

1. The PDF is the decision named, not another case.
2. It is an official copy, or the source is named.
3. It is about the R&D credit (or the incentive the page says).
4. Court, number, date, parties and outcome match the PDF's first page and
   ruling.
5. Every statement about what the court held or reasoned is in the PDF.
   Quotation marks surround only the court's exact words.
6. No case marked FAKE is cited. No reference list, no footnote markers.
7. If the page is not in English, the translation has been seen by the
   reviewer.

Then use **Publish**. This saves the change in the repository. The live
website does not change until the developer deploys it.

## 10. If something goes wrong

- You cannot sign in: ask the site owner to check that your GitHub account has been
  added.
- A draft cannot be published: read the check's message (section 7).
- A published page is wrong: set it to *Withdrawn* at once, tell the developer
  (the live page changes only when the developer deploys), then correct it.
- Anything else: tell the developer, with the address of the page.
