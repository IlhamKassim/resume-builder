"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
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
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-4 text-gray-600">
        <span>
          <span className="font-medium text-gray-900">{usage.generations}</span>
          {" "}generation{usage.generations !== 1 ? "s" : ""} this session
        </span>
        <span className="text-gray-300">|</span>
        <span>
          <span className="font-medium text-gray-900">{totalTokens.toLocaleString()}</span>
          {" "}tokens used
        </span>
      </div>
      <span className="text-gray-500">
        ~<span className="font-medium text-gray-900">${estimatedCost.toFixed(4)}</span> spent
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
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resume Builder</h1>
          <p className="mt-1 text-gray-500">
            Paste a job description and get a tailored resume in seconds.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <JobDescriptionInput
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 flex items-start justify-between gap-3">
              <p className="text-sm text-red-700">{error}</p>
              {lastJobDescription && (
                <button
                  onClick={() => handleGenerate(lastJobDescription)}
                  disabled={isGenerating}
                  className="shrink-0 text-sm font-medium text-red-700 underline underline-offset-2 disabled:opacity-50"
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
      </div>
    </main>
  );
}
