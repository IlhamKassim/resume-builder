"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { FitScan } from "@/components/FitScan";
import { BlueprintTitleBlock } from "@/components/BlueprintTitleBlock";
import { BlueprintPipeline } from "@/components/BlueprintPipeline";
import myProfile from "@/lib/my-profile";
import { estimateCost } from "@/lib/pricing";

interface SessionUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  generations: number;
}

interface AllTimeUsage {
  generations: number;
  cost: number;
}

interface Balance {
  toppedUp: number;
  estimatedRemaining: number;
}

function UsageBar({ usage, allTime }: { usage: SessionUsage; allTime: AllTimeUsage | null }) {
  const totalTokens = usage.inputTokens + usage.outputTokens + usage.cacheCreationTokens + usage.cacheReadTokens;
  const estimatedCost = estimateCost(usage);

  return (
    <div className="border border-[var(--bp-panel-line)] px-4 py-3 flex items-center justify-between gap-4 blueprint-mono text-[11.5px]">
      <div className="flex items-center gap-4 text-[var(--bp-line-dim)] flex-wrap">
        <span>
          <span className="text-[var(--bp-line)] tabular-nums">{usage.generations}</span>
          {" "}generation{usage.generations !== 1 ? "s" : ""} this session
        </span>
        <span className="text-[var(--bp-panel-line)]">|</span>
        <span>
          <span className="text-[var(--bp-line)] tabular-nums">{totalTokens.toLocaleString()}</span>
          {" "}tokens used
        </span>
        {usage.cacheReadTokens > 0 && (
          <>
            <span className="text-[var(--bp-panel-line)]">|</span>
            <span>
              <span className="text-[var(--bp-accent)] tabular-nums">{usage.cacheReadTokens.toLocaleString()}</span>
              {" "}cached (90% off)
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4 text-[var(--bp-line-dim)] shrink-0">
        <span>
          ~<span className="text-[var(--bp-accent)] tabular-nums">${estimatedCost.toFixed(4)}</span> spent
        </span>
        {allTime && (
          <>
            <span className="text-[var(--bp-panel-line)]">|</span>
            <span>
              <span className="text-[var(--bp-line)] tabular-nums">{allTime.generations}</span>
              {" "}all-time · ~$
              <span className="text-[var(--bp-line)] tabular-nums">{allTime.cost.toFixed(2)}</span>
              {" "}total
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function BalanceLine({ balance }: { balance: Balance }) {
  const low = balance.estimatedRemaining < 1;
  return (
    <p
      className={`blueprint-mono text-[11px] tracking-[0.02em] ${
        low ? "text-[var(--bp-accent)]" : "text-[var(--bp-line-dim)]"
      }`}
    >
      ≈$<span className="tabular-nums">{balance.estimatedRemaining.toFixed(2)}</span>
      {" "}est. balance remaining
      {" "}(${balance.toppedUp.toFixed(2)} topped up so far — logged locally, not Anthropic&apos;s own figure)
    </p>
  );
}

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionUsage, setSessionUsage] = useState<SessionUsage | null>(null);
  const [allTimeUsage, setAllTimeUsage] = useState<AllTimeUsage | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [pricingStale, setPricingStale] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/usage");
        if (!res.ok) return;
        const data = await res.json();
        setAllTimeUsage({ generations: data.totals.generations, cost: data.totals.cost });
        setBalance(data.balance);
        setPricingStale(Boolean(data.pricingStale));
      } catch {
        // Usage/balance are a nice-to-have; ignore fetch failures.
      }
    })();
  }, []);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: myProfile, jobDescription }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to generate resume. Please try again.");
        return;
      }

      if (data._usage) {
        setSessionUsage((prev) => ({
          inputTokens:         (prev?.inputTokens         ?? 0) + data._usage.inputTokens,
          outputTokens:        (prev?.outputTokens        ?? 0) + data._usage.outputTokens,
          cacheCreationTokens: (prev?.cacheCreationTokens ?? 0) + (data._usage.cacheCreationTokens ?? 0),
          cacheReadTokens:     (prev?.cacheReadTokens     ?? 0) + (data._usage.cacheReadTokens ?? 0),
          generations:         (prev?.generations         ?? 0) + 1,
        }));
      }

      const { _usage: _, _fidelityWarnings, ...resumeData } = data;
      sessionStorage.setItem("resumeData", JSON.stringify(resumeData));
      sessionStorage.setItem("jobDescription", jobDescription);
      sessionStorage.setItem("fidelityWarnings", JSON.stringify(_fidelityWarnings ?? []));
      sessionStorage.removeItem("coverLetterData");
      router.push("/preview");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="blueprint-sheet">
      <div className="max-w-[920px] mx-auto py-10 px-6 pb-24">
        <BlueprintTitleBlock
          dwgNo="RB-2026-01"
          rev="A"
          title="Automated Résumé Tailoring Apparatus"
          subtitle="Paste a job description and get a tailored resume in seconds."
        />

        {pricingStale && (
          <div className="border border-[var(--bp-accent)] p-3 mb-4 blueprint-mono text-[11px]">
            ⚠ Pricing constants past their known-good date (2026-08-31) — cost/balance figures
            below may be wrong. See docs/adr/0002-migrate-to-sonnet-5-despite-post-intro-price-increase.md.
          </div>
        )}

        <div className="flex justify-between items-center mb-8 -mt-4">
          {balance ? <BalanceLine balance={balance} /> : <span />}
          <Link
            href="/jobs"
            className="blueprint-mono text-[11px] tracking-[0.06em] uppercase text-[var(--bp-label)] hover:text-[var(--bp-accent)] transition-colors underline underline-offset-2"
          >
            Job Dossier →
          </Link>
        </div>

        <p className="blueprint-mono text-[11px] tracking-[0.1em] uppercase text-[var(--bp-accent)] mb-1">
          Fig. 2
        </p>
        <h2 className="text-[20px] font-normal mb-4">Control panel</h2>
        <div className="space-y-4">
          <JobDescriptionInput
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />

          {error && (
            <div className="border border-[var(--bp-accent)] p-3 flex items-start justify-between gap-3">
              <p className="text-sm text-[var(--bp-line)]">{error}</p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !jobDescription.trim()}
                className="blueprint-mono shrink-0 text-[11px] uppercase tracking-[0.04em] text-[var(--bp-accent)] underline underline-offset-2 disabled:opacity-50"
              >
                Try again
              </button>
            </div>
          )}

          <FitScan profile={myProfile} jobDescription={jobDescription} />
        </div>

        {sessionUsage && (
          <div className="mt-4">
            <UsageBar usage={sessionUsage} allTime={allTimeUsage} />
          </div>
        )}

        <div className="mt-14">
          <BlueprintPipeline />
        </div>
      </div>
    </main>
  );
}
