"use client";

import { useState } from "react";
import { analyzeFit, type FitAnalysis } from "@/lib/fit-analysis";
import type { ProfileData } from "@/lib/types";

interface Props {
  profile: ProfileData;
  jobDescription: string;
}

function KeywordChips({ keywords, accent }: { keywords: string[]; accent?: boolean }) {
  if (keywords.length === 0) {
    return <span className="blueprint-mono text-[11px] text-[var(--bp-line-dim)]">None</span>;
  }
  return (
    <span className="flex flex-wrap gap-1.5">
      {keywords.map((kw) => (
        <span
          key={kw}
          className={`blueprint-mono text-[11px] px-2 py-0.5 border ${
            accent
              ? "border-[var(--bp-accent)] text-[var(--bp-accent)]"
              : "border-[var(--bp-panel-line)] text-[var(--bp-line)]"
          }`}
        >
          {kw}
        </span>
      ))}
    </span>
  );
}

export function FitScan({ profile, jobDescription }: Props) {
  const [result, setResult] = useState<FitAnalysis | null>(null);

  function scan() {
    setResult(analyzeFit(profile, jobDescription));
  }

  return (
    <div className="border border-[var(--bp-panel-line)] p-5 grid gap-4">
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={scan}
          disabled={!jobDescription.trim()}
          className="blueprint-mono text-[11.5px] tracking-[0.06em] uppercase bg-[var(--bp-panel)] border-[1.3px] border-[var(--bp-line)] text-[var(--bp-line)] px-5 py-2.5 transition-colors hover:enabled:bg-[var(--bp-panel-line)] active:enabled:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Scan Fit — Free, Local
        </button>
        {!jobDescription.trim() && (
          <span className="blueprint-mono text-[11px] text-[var(--bp-line-dim)]">
            Paste a job description first.
          </span>
        )}
      </div>

      {result && (
        <div className="grid gap-4">
          <div className="flex items-baseline gap-3">
            <span className="blueprint-mono text-[28px] tabular-nums text-[var(--bp-accent)]">
              {result.coverage}%
            </span>
            <span className="blueprint-mono text-[11px] text-[var(--bp-line-dim)]">
              of {result.totalKeywords} recognized keyword{result.totalKeywords === 1 ? "" : "s"} in
              this job description already appear in your profile.
            </span>
          </div>

          <div className="grid gap-2">
            <p className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-label)]">
              Matched ({result.matchedKeywords.length})
            </p>
            <KeywordChips keywords={result.matchedKeywords} />
          </div>

          <div className="grid gap-2">
            <p className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-label)]">
              Missing — verify these are actually in your background, then add them to your profile
            </p>
            <KeywordChips keywords={result.missingKeywords} accent />
          </div>

          <p className="blueprint-mono text-[11px] text-[var(--bp-line-dim)]">
            A deterministic keyword scan, not a Claude call — add the missing terms you genuinely
            have to <code className="text-[var(--bp-line)]">lib/my-profile.ts</code> and re-scan.
          </p>
        </div>
      )}
    </div>
  );
}
