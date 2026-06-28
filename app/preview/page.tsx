"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ResumePreview } from "@/components/ResumePreview";
import type { ResumeData } from "@/lib/types";
import { ResumeDataSchema } from "@/lib/types";

export default function PreviewPage() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
    }
  }, [router]);

  async function handleDownload() {
    if (!resumeData) return;
    setIsDownloading(true);
    setError(null);

    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to generate PDF. Please try again.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${resumeData.contact.name.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-[760px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Back
            </button>
            <span className="text-sm font-medium text-gray-900">Resume Preview</span>
          </div>
          <div className="flex items-center gap-2">
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? "Generating PDF…" : "Download PDF"}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="py-8 px-4">
        <ResumePreview data={resumeData} />
      </div>
    </div>
  );
}
