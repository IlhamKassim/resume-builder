"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ResumePreview } from "@/components/ResumePreview";
import { CoverLetterPreview } from "@/components/CoverLetterPreview";
import myProfile from "@/lib/my-profile";
import type { ResumeData, CoverLetterData } from "@/lib/types";
import { ResumeDataSchema, CoverLetterDataSchema } from "@/lib/types";

type Tab = "resume" | "cover-letter";

function setAtPath<T>(obj: T, path: (string | number)[], value: unknown): T {
  const clone = structuredClone(obj) as Record<string, unknown>;
  let cur: Record<string, unknown> = clone;
  for (let i = 0; i < path.length - 1; i++) {
    cur = cur[path[i] as string] as Record<string, unknown>;
  }
  cur[path[path.length - 1]] = value;
  return clone as T;
}

export default function PreviewPage() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState<string | null>(null);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("resume");
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function handlePrint() {
    const el = previewRef.current;
    const height = el ? el.scrollHeight : 0;
    const width = el ? el.scrollWidth : 0;
    const style = document.createElement("style");
    style.textContent = `@media print { @page { size: ${width}px ${height}px; margin: 0; } }`;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  }

  function updateResumeField(path: (string | number)[], value: string | string[]) {
    setResumeData((prev) => {
      if (!prev) return prev;
      const next = setAtPath(prev, path, value);
      sessionStorage.setItem("resumeData", JSON.stringify(next));
      return next;
    });
  }

  function updateCoverLetterField(path: (string | number)[], value: string) {
    setCoverLetterData((prev) => {
      if (!prev) return prev;
      const next = setAtPath(prev, path, value);
      sessionStorage.setItem("coverLetterData", JSON.stringify(next));
      return next;
    });
  }

  async function handleGenerateCoverLetter() {
    if (!jobDescription) return;
    setIsGeneratingCoverLetter(true);
    setCoverLetterError(null);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: myProfile, jobDescription }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCoverLetterError(data.error ?? "Failed to generate cover letter. Please try again.");
        return;
      }

      const { _usage: _, ...coverLetter } = data;
      setCoverLetterData(coverLetter);
      sessionStorage.setItem("coverLetterData", JSON.stringify(coverLetter));
      setActiveTab("cover-letter");
    } catch {
      setCoverLetterError("Network error. Please try again.");
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  }

  useEffect(() => {
    const raw = sessionStorage.getItem("resumeData");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      const parsed = ResumeDataSchema.parse(JSON.parse(raw));
      setResumeData(parsed);
    } catch {
      router.replace("/");
      return;
    }

    setJobDescription(sessionStorage.getItem("jobDescription"));

    const rawCoverLetter = sessionStorage.getItem("coverLetterData");
    if (rawCoverLetter) {
      try {
        setCoverLetterData(CoverLetterDataSchema.parse(JSON.parse(rawCoverLetter)));
      } catch {
        sessionStorage.removeItem("coverLetterData");
      }
    }
  }, [router]);

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white print:min-h-0">
      {/* Toolbar — hidden when printing */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 print:hidden">
        <div className="max-w-[760px] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Back
            </button>
            <div className="flex items-center rounded-md border border-gray-200 p-0.5 text-sm">
              <button
                onClick={() => setActiveTab("resume")}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === "resume" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Resume
              </button>
              <button
                onClick={() => (coverLetterData ? setActiveTab("cover-letter") : handleGenerateCoverLetter())}
                disabled={isGeneratingCoverLetter || (!coverLetterData && !jobDescription)}
                className={`px-3 py-1 rounded transition-colors disabled:opacity-50 ${
                  activeTab === "cover-letter" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {isGeneratingCoverLetter
                  ? "Generating…"
                  : coverLetterData
                    ? "Cover Letter"
                    : "Generate Cover Letter"}
              </button>
            </div>
          </div>
          <Button onClick={handlePrint}>Save as PDF</Button>
        </div>
        {coverLetterError && (
          <div className="max-w-[760px] mx-auto mt-2 text-sm text-red-700">{coverLetterError}</div>
        )}
        <p className="max-w-[760px] mx-auto mt-2 text-xs text-gray-400 print:hidden">
          Click any text below to edit it before saving as PDF.
        </p>
      </div>

      {/* Preview — remove wrapper padding when printing so resume fills the page */}
      <div className="py-8 px-4 print:p-0">
        {activeTab === "resume" || !coverLetterData ? (
          <ResumePreview data={resumeData} onEdit={updateResumeField} ref={previewRef} />
        ) : (
          <CoverLetterPreview
            data={coverLetterData}
            contact={resumeData.contact}
            onEdit={updateCoverLetterField}
            ref={previewRef}
          />
        )}
      </div>
    </div>
  );
}
