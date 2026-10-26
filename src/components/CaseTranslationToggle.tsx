"use client";

import { useState } from "react";
import Link from "next/link";
import { CaseRecord } from "@/types/case";
import { CaseUiLabels } from "@/data/country-labels";
import { CaseBody } from "@/components/CaseBody";

const DEFAULT_LABELS: CaseUiLabels = {
  date: "Date:",
  parties: "Parties:",
  outcome: "Outcome:",
  year: "Year:",
  court: "Court:",
  subject: "Subject:",
  caseNo: "Case No.:",
  backToPrefix: "← Back to ",
  showTranslation: "Show English translation",
  showOriginal: "Show original",
};

const TRANSLATION_LABEL_UNDER_REVIEW =
  "English translation, machine-assisted, under review";
const TRANSLATION_LABEL_REVIEWED = "English translation";

export function CaseTranslationToggle({
  caseRecord,
  jurisdictionName,
  backHref,
  labels,
}: {
  caseRecord: CaseRecord;
  jurisdictionName: string;
  backHref: string;
  labels?: CaseUiLabels;
}) {
  const [showTranslation, setShowTranslation] = useState(false);
  const l = labels ?? DEFAULT_LABELS;
  const translation = caseRecord.translation;
  const active = showTranslation && translation ? translation : caseRecord;

  const showingTranslation = showTranslation && !!translation;
  const articleTitle =
    showingTranslation && translation?.articleTitle
      ? translation.articleTitle
      : caseRecord.articleTitle;

  return (
    <>
      {showingTranslation && (
        // Wording set by the client's reviewer: a translation stays
        // "under review" until its `reviewed` flag is set.
        <p
          className={`mt-2 inline-block rounded-md border px-3 py-1 text-xs font-medium ${
            translation.reviewed
              ? "border-slate-300 bg-slate-50 text-slate-700"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          {translation.reviewed
            ? TRANSLATION_LABEL_REVIEWED
            : TRANSLATION_LABEL_UNDER_REVIEW}
        </p>
      )}
      <h1 className="mt-2 text-3xl font-bold text-slate-900">
        {active.title}
      </h1>
      {articleTitle && (
        <p className="mt-2 text-sm italic text-slate-600">{articleTitle}</p>
      )}

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
        <div className="flex gap-1">
          <dt className="font-medium">{l.year}</dt>
          <dd>{caseRecord.year}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-medium">{l.caseNo}</dt>
          <dd>{caseRecord.caseNumber}</dd>
        </div>
        {caseRecord.court && (
          <div className="flex gap-1">
            <dt className="font-medium">{l.court}</dt>
            <dd>{caseRecord.court}</dd>
          </div>
        )}
        <div className="flex gap-1">
          <dt className="font-medium">{l.subject}</dt>
          <dd>{caseRecord.subject}</dd>
        </div>
        {caseRecord.decisionDate && (
          <div className="flex gap-1">
            <dt className="font-medium">{l.date}</dt>
            <dd>{caseRecord.decisionDate}</dd>
          </div>
        )}
        {caseRecord.parties && (
          <div className="flex gap-1">
            <dt className="font-medium">{l.parties}</dt>
            <dd>{caseRecord.parties}</dd>
          </div>
        )}
        {caseRecord.outcome && (
          <div className="flex gap-1">
            <dt className="font-medium">{l.outcome}</dt>
            <dd>{caseRecord.outcome}</dd>
          </div>
        )}
      </dl>

      <p className="mt-6 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        {active.summary}
      </p>
      <p className="mt-2 text-xs italic text-slate-600">
        Summary prepared by Swanson Reed. Refer to the official decision for
        the authoritative text.
      </p>

      {translation && (
        <button
          type="button"
          onClick={() => setShowTranslation((v) => !v)}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700"
        >
          {showTranslation ? l.showOriginal : l.showTranslation}
        </button>
      )}

      <CaseBody blocks={active.body} />

      <Link
        href={backHref}
        className="mt-10 inline-block text-sm font-medium text-blue-700 hover:underline"
      >
        {l.backToPrefix}
        {jurisdictionName}
      </Link>
    </>
  );
}
