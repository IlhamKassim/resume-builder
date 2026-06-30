"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ResumePreview } from "@/components/ResumePreview";
import type { ResumeData } from "@/lib/types";
import { ResumeDataSchema } from "@/lib/types";

export default function PreviewPage() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
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

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 print:hidden">
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
          <Button onClick={() => window.print()}>Save as PDF</Button>
        </div>
      </div>

      {/* Preview — remove wrapper padding when printing so resume fills the page */}
      <div className="py-8 px-4 print:p-0">
        <ResumePreview data={resumeData} />
      </div>
    </div>
  );
}
