"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { BlueprintTitleBlock } from "@/components/BlueprintTitleBlock";
import { BlueprintPipeline } from "@/components/BlueprintPipeline";
import myProfile from "@/lib/my-profile";

// Claude Sonnet 4.6 pricing (per million tokens)
const PRICE_INPUT_PER_M  = 3.00;
const PRICE_OUTPUT_PER_M = 15.00;

interface SessionUsage {
  inputTokens: number;
  outputTokens: number;
  generations: number;
}

function cost(usage: SessionUsage): number {
  return (
    (usage.inputTokens  / 1_000_000) * PRICE_INPUT_PER_M +
    (usage.outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M
  );
}

function UsageBar({ usage }: { usage: SessionUsage }) {
  const totalTokens = usage.inputTokens + usage.outputTokens;
  const estimatedCost = cost(usage);

  return (
    <div className="border border-[var(--bp-panel-line)] px-4 py-3 flex items-center justify-between gap-4 blueprint-mono text-[11.5px]">
      <div className="flex items-center gap-4 text-[var(--bp-line-dim)]">
        <span>
          <span className="text-[var(--bp-line)] tabular-nums">{usage.generations}</span>
          {" "}generation{usage.generations !== 1 ? "s" : ""} this session
        </span>
        <span className="text-[var(--bp-panel-line)]">|</span>
        <span>
          <span className="text-[var(--bp-line)] tabular-nums">{totalTokens.toLocaleString()}</span>
          {" "}tokens used
        </span>
      </div>
      <span className="text-[var(--bp-line-dim)]">
        ~<span className="text-[var(--bp-accent)] tabular-nums">${estimatedCost.toFixed(4)}</span> spent
      </span>
    </div>
  );
}

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastJobDescription, setLastJobDescription] = useState<string | null>(null);
  const [sessionUsage, setSessionUsage] = useState<SessionUsage | null>(null);
  const router = useRouter();

  async function handleGenerate(jobDescription: string) {
    setIsGenerating(true);
    setError(null);
    setLastJobDescription(jobDescription);

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
          inputTokens:  (prev?.inputTokens  ?? 0) + data._usage.inputTokens,
          outputTokens: (prev?.outputTokens ?? 0) + data._usage.outputTokens,
          generations:  (prev?.generations  ?? 0) + 1,
        }));
      }

      const { _usage: _, ...resumeData } = data;
      sessionStorage.setItem("resumeData", JSON.stringify(resumeData));
      sessionStorage.setItem("jobDescription", jobDescription);
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

        <div className="flex justify-end mb-8 -mt-4">
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
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />

          {error && (
            <div className="border border-[var(--bp-accent)] p-3 flex items-start justify-between gap-3">
              <p className="text-sm text-[var(--bp-line)]">{error}</p>
              {lastJobDescription && (
                <button
                  onClick={() => handleGenerate(lastJobDescription)}
                  disabled={isGenerating}
                  className="blueprint-mono shrink-0 text-[11px] uppercase tracking-[0.04em] text-[var(--bp-accent)] underline underline-offset-2 disabled:opacity-50"
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>

        {sessionUsage && (
          <div className="mt-4">
            <UsageBar usage={sessionUsage} />
          </div>
        )}

        <div className="mt-14">
          <BlueprintPipeline />
        </div>
      </div>
    </main>
  );
}
