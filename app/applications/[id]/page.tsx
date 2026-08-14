"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BlueprintTitleBlock } from "@/components/BlueprintTitleBlock";
import { ResumePreview } from "@/components/ResumePreview";
import { CoverLetterPreview } from "@/components/CoverLetterPreview";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_ORDER,
  type Application,
  type ApplicationStatus,
} from "@/lib/applications";

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [app, setApp] = useState<Application | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/applications/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as Application;
        if (cancelled) return;
        setApp(data);
        setNotes(data.notes ?? "");
      } catch {
        // Leave the page in a loading state.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function changeStatus(status: ApplicationStatus) {
    setSavingStatus(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setMessage("Could not update status.");
        return;
      }
      setApp(await res.json());
    } catch {
      setMessage("Could not update status.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function saveNotes() {
    setSavingNotes(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        setMessage("Could not save notes.");
        return;
      }
      setApp(await res.json());
      setMessage("Notes saved.");
    } catch {
      setMessage("Could not save notes.");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this application and its saved documents?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setMessage("Could not delete the application.");
        return;
      }
      router.push("/applications");
    } catch {
      setMessage("Could not delete the application.");
    } finally {
      setDeleting(false);
    }
  }

  if (notFound) {
    return (
      <main className="blueprint-sheet">
        <div className="max-w-[760px] mx-auto py-10 px-6">
          <p className="blueprint-mono text-[12px] text-[var(--bp-line-dim)]">
            Application not found.{" "}
            <Link href="/applications" className="text-[var(--bp-accent)] underline">
              Back to tracker →
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if (!app) {
    return (
      <main className="blueprint-sheet flex items-center justify-center">
        <p className="blueprint-mono text-[var(--bp-line-dim)] text-sm">Loading…</p>
      </main>
    );
  }

  return (
    <main className="blueprint-sheet">
      <div className="max-w-[920px] mx-auto py-10 px-6 pb-24">
        <BlueprintTitleBlock
          dwgNo="RB-2026-04"
          rev="A"
          title={`${app.company} — ${app.role}`}
          subtitle={app.url ?? ""}
          backHref="/applications"
        />

        <div className="flex flex-wrap items-center gap-3 mb-8 -mt-4">
          <label className="blueprint-mono text-[11px] text-[var(--bp-label)] tracking-[0.04em] uppercase">
            Status
          </label>
          <select
            value={app.status}
            disabled={savingStatus}
            onChange={(e) => changeStatus(e.target.value as ApplicationStatus)}
            className="bg-[var(--bp-panel)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-2"
          >
            {APPLICATION_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {APPLICATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="blueprint-mono text-[11px] tracking-[0.06em] uppercase border border-[var(--bp-accent)] text-[var(--bp-accent)] px-3 py-2 hover:bg-[var(--bp-panel-line)] transition-colors disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
          {message && (
            <span className="blueprint-mono text-[11px] text-[var(--bp-line-dim)]">{message}</span>
          )}
        </div>

        <div className="grid gap-6 mb-10">
          <section className="border border-[var(--bp-panel-line)] p-5 grid gap-2">
            <p className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-accent)]">
              Notes
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Contacts, follow-up dates, interview feedback…"
              className="bg-[var(--bp-panel)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-2 resize-y placeholder:text-[var(--bp-line-dim)]"
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="justify-self-start blueprint-mono text-[11px] tracking-[0.06em] uppercase bg-[var(--bp-panel)] border-[1.3px] border-[var(--bp-line)] text-[var(--bp-line)] px-4 py-2 hover:enabled:bg-[var(--bp-panel-line)] transition-colors disabled:opacity-40"
            >
              {savingNotes ? "Saving…" : "Save notes"}
            </button>
          </section>

          {app.jobDescription && (
            <section className="border border-[var(--bp-panel-line)] p-5 grid gap-2">
              <p className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-accent)]">
                Job Description
              </p>
              <p className="text-[13px] text-[var(--bp-line-dim)] whitespace-pre-wrap">
                {app.jobDescription}
              </p>
            </section>
          )}
        </div>

        {app.resume && (
          <section className="mb-10">
            <p className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-accent)] mb-3">
              Tailored Resume
            </p>
            <ResumePreview data={app.resume} />
          </section>
        )}

        {app.coverLetter && app.resume && (
          <section>
            <p className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-accent)] mb-3">
              Cover Letter
            </p>
            <CoverLetterPreview data={app.coverLetter} contact={app.resume.contact} />
          </section>
        )}
      </div>
    </main>
  );
}
