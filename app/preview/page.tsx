"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BlueprintThemeToggle } from "@/components/BlueprintThemeToggle";
import { ResumePreview } from "@/components/ResumePreview";
import { CoverLetterPreview } from "@/components/CoverLetterPreview";
import myProfile from "@/lib/my-profile";
import type { ResumeData, CoverLetterData, InterviewPrepData } from "@/lib/types";
import { ResumeDataSchema, CoverLetterDataSchema, InterviewPrepDataSchema } from "@/lib/types";
import type { FidelityViolation } from "@/lib/fidelity-check";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_ORDER,
  type ApplicationStatus,
} from "@/lib/applications";

const CHECKLIST_ITEMS = [
  "No bullet mixes facts from two different jobs or projects into one claim",
  "No qualifier got dropped (paper vs. live, team credit vs. individual, backtested vs. confirmed)",
  "Dates, titles, and numbers read exactly as you'd defend them in an interview",
];

type Tab = "resume" | "cover-letter" | "interview";

const INTERVIEW_CATEGORY_LABEL: Record<InterviewPrepData["questions"][number]["category"], string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  "company-fit": "Company Fit",
};

const INTERVIEW_CATEGORY_ORDER: InterviewPrepData["questions"][number]["category"][] = [
  "technical",
  "behavioral",
  "company-fit",
];

function setAtPath<T>(obj: T, path: (string | number)[], value: unknown): T {
  const clone = structuredClone(obj) as Record<string, unknown>;
  let cur: Record<string, unknown> = clone;
  for (let i = 0; i < path.length - 1; i++) {
    cur = cur[path[i] as string] as Record<string, unknown>;
  }
  cur[path[path.length - 1]] = value;
  return clone as T;
}

function readSession(key: string): string | null {
  return typeof window === "undefined" ? null : sessionStorage.getItem(key);
}

export default function PreviewPage() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(() => {
    const raw = readSession("resumeData");
    if (!raw) return null;
    try {
      return ResumeDataSchema.parse(JSON.parse(raw));
    } catch {
      return null;
    }
  });
  const [jobDescription] = useState<string | null>(() => readSession("jobDescription"));
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData | null>(() => {
    const raw = readSession("coverLetterData");
    if (!raw) return null;
    try {
      return CoverLetterDataSchema.parse(JSON.parse(raw));
    } catch {
      if (typeof window !== "undefined") sessionStorage.removeItem("coverLetterData");
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState<Tab>("resume");
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null);
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrepData | null>(() => {
    const raw = readSession("interviewPrep");
    if (!raw) return null;
    try {
      return InterviewPrepDataSchema.parse(JSON.parse(raw));
    } catch {
      if (typeof window !== "undefined") sessionStorage.removeItem("interviewPrep");
      return null;
    }
  });
  const [isGeneratingInterview, setIsGeneratingInterview] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveCompany, setSaveCompany] = useState("");
  const [saveRole, setSaveRole] = useState("");
  const [saveStatus, setSaveStatus] = useState<ApplicationStatus>("saved");
  const [saveNotes, setSaveNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [fidelityWarnings, setFidelityWarnings] = useState<FidelityViolation[]>(() => {
    const raw = readSession("fidelityWarnings");
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      if (typeof window !== "undefined") sessionStorage.removeItem("fidelityWarnings");
      return [];
    }
  });
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

  async function handleGenerateInterview() {
    if (!jobDescription || !resumeData) return;
    setIsGeneratingInterview(true);
    setInterviewError(null);
    try {
      const res = await fetch("/api/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: myProfile, jobDescription, resume: resumeData }),
      });
      const data = await res.json();

      if (!res.ok) {
        setInterviewError(data.error ?? "Failed to generate interview prep. Please try again.");
        return;
      }

      const { _usage: _, ...prep } = data;
      setInterviewPrep(prep);
      sessionStorage.setItem("interviewPrep", JSON.stringify(prep));
      setActiveTab("interview");
    } catch {
      setInterviewError("Network error. Please try again.");
    } finally {
      setIsGeneratingInterview(false);
    }
  }

  async function handleSaveToTracker() {
    if (!saveCompany.trim() || !saveRole.trim()) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: saveCompany.trim(),
          role: saveRole.trim(),
          status: saveStatus,
          notes: saveNotes.trim() || undefined,
          jobDescription: jobDescription ?? "",
          resume: resumeData,
          coverLetter: coverLetterData ?? undefined,
          fidelityWarnings,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMessage(data.error ?? "Could not save to tracker.");
        return;
      }
      setSaveCompany("");
      setSaveRole("");
      setSaveNotes("");
      setShowSaveForm(false);
      setSaveMessage(`Saved as "${data.company} — ${data.role}".`);
    } catch {
      setSaveMessage("Could not save to tracker.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!resumeData) {
      router.replace("/");
    }
  }, [resumeData, router]);

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
              <button
                onClick={() => (interviewPrep ? setActiveTab("interview") : handleGenerateInterview())}
                disabled={isGeneratingInterview || (!interviewPrep && !jobDescription)}
                className={`px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === "interview"
                    ? "bg-[var(--bp-panel-line)] text-[var(--bp-line)]"
                    : "text-[var(--bp-line-dim)] hover:text-[var(--bp-line)]"
                }`}
              >
                {isGeneratingInterview
                  ? "Generating…"
                  : interviewPrep
                    ? "Interview"
                    : "Interview Prep"}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BlueprintThemeToggle />
            <button
              onClick={() => setShowSaveForm((v) => !v)}
              className="blueprint-mono text-[11px] tracking-[0.06em] uppercase border-[1.3px] border-[var(--bp-accent)] text-[var(--bp-accent)] px-4 py-2 hover:bg-[var(--bp-panel-line)] transition-colors"
            >
              {showSaveForm ? "Close" : "Save to Tracker"}
            </button>
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
        {interviewError && (
          <div className="max-w-[760px] mx-auto mt-2 blueprint-mono text-[12px] text-[var(--bp-accent)]">{interviewError}</div>
        )}
        {saveMessage && (
          <div className="max-w-[760px] mx-auto mt-2 blueprint-mono text-[12px] text-[var(--bp-accent)]">{saveMessage}</div>
        )}
        {showSaveForm && (
          <div className="max-w-[760px] mx-auto mt-2 border border-[var(--bp-panel-line)] bg-[var(--bp-panel)] p-4 grid gap-3">
            <p className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-accent)]">
              Save to Tracker
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="blueprint-mono text-[11px] text-[var(--bp-label)]">
                Company *
                <input
                  value={saveCompany}
                  onChange={(e) => setSaveCompany(e.target.value)}
                  className="mt-1 w-full bg-[var(--bp-bg)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-2 placeholder:text-[var(--bp-line-dim)]"
                  placeholder="Acme Corp"
                />
              </label>
              <label className="blueprint-mono text-[11px] text-[var(--bp-label)]">
                Role *
                <input
                  value={saveRole}
                  onChange={(e) => setSaveRole(e.target.value)}
                  className="mt-1 w-full bg-[var(--bp-bg)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-2 placeholder:text-[var(--bp-line-dim)]"
                  placeholder="Senior Software Engineer"
                />
              </label>
            </div>
            <label className="blueprint-mono text-[11px] text-[var(--bp-label)]">
              Status
              <select
                value={saveStatus}
                onChange={(e) => setSaveStatus(e.target.value as ApplicationStatus)}
                className="mt-1 w-full bg-[var(--bp-bg)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-2"
              >
                {APPLICATION_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {APPLICATION_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="blueprint-mono text-[11px] text-[var(--bp-label)]">
              Notes
              <textarea
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full bg-[var(--bp-bg)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-2 resize-y placeholder:text-[var(--bp-line-dim)]"
                placeholder="Optional — contacts, deadlines, follow-ups…"
              />
            </label>
            <button
              onClick={handleSaveToTracker}
              disabled={isSaving || !saveCompany.trim() || !saveRole.trim()}
              className="justify-self-start blueprint-mono text-[11px] tracking-[0.06em] uppercase bg-[var(--bp-panel-line)] text-[var(--bp-line)] px-4 py-2 hover:enabled:bg-[var(--bp-line)] hover:enabled:text-[var(--bp-bg)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
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
        {activeTab === "interview" ? (
          interviewPrep ? (
            <InterviewPrepView data={interviewPrep} />
          ) : (
            <div className="max-w-[760px] mx-auto text-center py-16">
              <button
                onClick={handleGenerateInterview}
                disabled={isGeneratingInterview || !jobDescription}
                className="blueprint-mono text-[11px] tracking-[0.06em] uppercase bg-[var(--bp-panel)] border-[1.3px] border-[var(--bp-line)] text-[var(--bp-line)] px-6 py-3 hover:enabled:bg-[var(--bp-panel-line)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGeneratingInterview ? "Generating…" : "Generate Interview Prep"}
              </button>
            </div>
          )
        ) : activeTab === "cover-letter" && coverLetterData ? (
          <CoverLetterPreview
            data={coverLetterData}
            contact={resumeData.contact}
            onEdit={updateCoverLetterField}
            ref={previewRef}
          />
        ) : (
          <ResumePreview data={resumeData} onEdit={updateResumeField} ref={previewRef} />
        )}
      </div>
    </div>
  );
}

function InterviewPrepView({ data }: { data: InterviewPrepData }) {
  return (
    <div className="max-w-[760px] mx-auto space-y-8">
      {INTERVIEW_CATEGORY_ORDER.map((cat) => {
        const questions = data.questions.filter((q) => q.category === cat);
        if (questions.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="blueprint-mono text-[11px] tracking-[0.08em] uppercase text-[var(--bp-accent)] mb-3">
              {INTERVIEW_CATEGORY_LABEL[cat]}
            </h2>
            <ol className="space-y-3 list-none">
              {questions.map((q, i) => (
                <li key={i} className="border border-[var(--bp-panel-line)] p-4">
                  <p className="text-sm text-[var(--bp-line)] mb-1.5">
                    <span className="blueprint-mono text-[var(--bp-label)] mr-1.5">{i + 1}.</span>
                    {q.question}
                  </p>
                  {q.hint && (
                    <p className="blueprint-mono text-[11px] text-[var(--bp-line-dim)]">
                      Hint: {q.hint}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
