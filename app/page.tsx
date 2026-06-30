"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import myProfile from "@/lib/my-profile";

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastJobDescription, setLastJobDescription] = useState<string | null>(null);
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

      sessionStorage.setItem("resumeData", JSON.stringify(data));
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
      </div>
    </main>
  );
}
