"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BlueprintThemeToggle } from "@/components/BlueprintThemeToggle";
import { ResumePreview } from "@/components/ResumePreview";
import { CoverLetterPreview } from "@/components/CoverLetterPreview";
import myProfile from "@/lib/my-profile";
import type { ResumeData, CoverLetterData } from "@/lib/types";
import { ResumeDataSchema, CoverLetterDataSchema } from "@/lib/types";
import type { FidelityViolation } from "@/lib/fidelity-check";

const CHECKLIST_ITEMS = [
  "No bullet mixes facts from two different jobs or projects into one claim",
  "No qualifier got dropped (paper vs. live, team credit vs. individual, backtested vs. confirmed)",
  "Dates, titles, and numbers read exactly as you'd defend them in an interview",
];

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
  const [fidelityWarnings, setFidelityWarnings] = useState<FidelityViolation[]>([]);
  const [checklistChecked, setChecklistChecked] = useState<boolean[]>(CHECKLIST_ITEMS.map(() => false));
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
    // Editing the resume invalidates any existing cover letter — it was written to complement
    // (and avoid repeating) the PREVIOUS resume content, so it can silently drift out of sync
    // with what the resume now says. Force a fresh generation rather than show a stale pairing.
    setCoverLetterData(null);
    sessionStorage.removeItem("coverLetterData");
    setCoverLetterError(null);
    setActiveTab("resume");
    // The fidelity check ran against the AI's original output — a manual edit invalidates it
    // (it might fix the flagged issue, or introduce a new one the automated check can't see),
    // and the pre-send checklist needs re-confirming against the now-different text.
    setFidelityWarnings([]);
    sessionStorage.removeItem("fidelityWarnings");
    setChecklistChecked(CHECKLIST_ITEMS.map(() => false));
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
    if (!jobDescription || !resumeData) return;
    setIsGeneratingCoverLetter(true);
    setCoverLetterError(null);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: myProfile, jobDescription, resume: resumeData }),
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

    const rawFidelity = sessionStorage.getItem("fidelityWarnings");
    if (rawFidelity) {
      try {
        setFidelityWarnings(JSON.parse(rawFidelity));
      } catch {
        sessionStorage.removeItem("fidelityWarnings");
      }
    }

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
      <div className="blueprint-sheet flex items-center justify-center">
        <p className="blueprint-mono text-[var(--bp-line-dim)] text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="blueprint-sheet print:bg-white print:min-h-0">
      {/* Toolbar — hidden when printing */}
      <div className="sticky top-0 z-10 bg-[var(--bp-bg)] border-b border-[var(--bp-panel-line)] px-4 py-3 print:hidden">
        <div className="max-w-[760px] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="blueprint-mono text-[11px] tracking-[0.06em] uppercase text-[var(--bp-label)] hover:text-[var(--bp-accent)] transition-colors"
            >
              ← Back
            </button>
            <div className="flex items-center border border-[var(--bp-panel-line)] p-0.5 blueprint-mono text-[11px] tracking-[0.04em] uppercase">
              <button
                onClick={() => setActiveTab("resume")}
                className={`px-3 py-1.5 transition-colors ${
                  activeTab === "resume"
                    ? "bg-[var(--bp-panel-line)] text-[var(--bp-line)]"
                    : "text-[var(--bp-line-dim)] hover:text-[var(--bp-line)]"
                }`}
              >
                Resume
              </button>
              <button
                onClick={() => (coverLetterData ? setActiveTab("cover-letter") : handleGenerateCoverLetter())}
                disabled={isGeneratingCoverLetter || (!coverLetterData && !jobDescription)}
                className={`px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === "cover-letter"
                    ? "bg-[var(--bp-panel-line)] text-[var(--bp-line)]"
                    : "text-[var(--bp-line-dim)] hover:text-[var(--bp-line)]"
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
          <div className="flex items-center gap-2">
            <BlueprintThemeToggle />
            <button
              onClick={handlePrint}
              disabled={!checklistChecked.every(Boolean)}
              title={
                checklistChecked.every(Boolean)
                  ? undefined
                  : "Confirm every checklist item below before saving"
              }
              className="blueprint-mono text-[11px] tracking-[0.06em] uppercase bg-[var(--bp-panel)] border-[1.3px] border-[var(--bp-line)] text-[var(--bp-line)] px-4 py-2 hover:bg-[var(--bp-panel-line)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--bp-panel)]"
            >
              Save as PDF
            </button>
          </div>
        </div>
        {coverLetterError && (
          <div className="max-w-[760px] mx-auto mt-2 blueprint-mono text-[12px] text-[var(--bp-accent)]">{coverLetterError}</div>
        )}
        {fidelityWarnings.length > 0 && (
          <div className="max-w-[760px] mx-auto mt-2 blueprint-mono text-[11px] print:hidden border border-[var(--bp-accent)] px-2 py-1.5 space-y-0.5">
            <p className="text-[var(--bp-accent)]">
              ⚠ Automated fidelity check found {fidelityWarnings.length} thing
              {fidelityWarnings.length === 1 ? "" : "s"} to verify against your real profile:
            </p>
            <ul className="list-none space-y-0.5 text-[var(--bp-line-dim)]">
              {fidelityWarnings.map((w, i) => (
                <li key={i}>
                  [{w.category}] {w.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* No automated check catches everything on this list — see
            docs/adr/0004-prevent-cross-entry-fact-conflation-in-prompt-not-detector.md.
            This is the deliberate manual gate before a real send, enforced (not just suggested)
            by disabling "Save as PDF" until every item is confirmed. */}
        <ul className="max-w-[760px] mx-auto mt-2 blueprint-mono text-[11px] text-[var(--bp-line-dim)] print:hidden list-none space-y-1">
          {CHECKLIST_ITEMS.map((item, i) => (
            <li key={i}>
              <label className="flex items-start gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklistChecked[i]}
                  onChange={(e) =>
                    setChecklistChecked((prev) => {
                      const next = [...prev];
                      next[i] = e.target.checked;
                      return next;
                    })
                  }
                  className="mt-0.5"
                />
                <span>{item}</span>
              </label>
            </li>
          ))}
        </ul>
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
