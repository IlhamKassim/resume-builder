"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileInput } from "@/components/ProfileInput";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import type { ProfileData } from "@/lib/types";

export default function Home() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleGenerate(jobDescription: string) {
    if (!profile) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, jobDescription }),
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
            Tailored resumes in seconds — no manual editing required.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
                1
              </span>
              <span className="text-sm font-medium text-gray-700">Load your profile</span>
            </div>
            <ProfileInput
              onProfile={(p) => {
                setProfile(p);
                sessionStorage.setItem("profileData", JSON.stringify(p));
              }}
            />
          </div>

          {profile && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
                  2
                </span>
                <span className="text-sm font-medium text-gray-700">
                  Paste the job description
                </span>
              </div>
              <JobDescriptionInput
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
