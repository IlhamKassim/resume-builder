"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BlueprintTitleBlock } from "@/components/BlueprintTitleBlock";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_ORDER,
  type Application,
  type ApplicationStatus,
} from "@/lib/applications";

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("saved");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/applications");
      if (!res.ok) return;
      setApplications(await res.json());
    } catch {
      // Optional — leave the list empty on failure.
    }
  }, []);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          url: url.trim() || undefined,
          location: location.trim() || undefined,
          country: country.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        setError("Could not add the application.");
        return;
      }
      setCompany("");
      setRole("");
      setUrl("");
      setLocation("");
      setCountry("");
      setStatus("saved");
      setNotes("");
      setShowForm(false);
      await load();
    } catch {
      setError("Could not add the application.");
    } finally {
      setSaving(false);
    }
  }

  const counts = applications
    ? APPLICATION_STATUS_ORDER.map((s) => ({
        status: s,
        count: applications.filter((a) => a.status === s).length,
      })).filter((c) => c.count > 0)
    : [];

  return (
    <main className="blueprint-sheet">
      <div className="max-w-[920px] mx-auto py-10 px-6 pb-24">
        <BlueprintTitleBlock
          dwgNo="RB-2026-03"
          rev="A"
          title="Application Tracker"
          subtitle="Every tailored resume and cover letter, saved instead of discarded."
          backHref="/"
        />

        <div className="flex items-center justify-between gap-4 mb-8 -mt-4 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {counts.length === 0 ? (
              <span className="blueprint-mono text-[11px] text-[var(--bp-line-dim)]">
                No applications tracked yet.
              </span>
            ) : (
              counts.map(({ status: s, count }) => (
                <span
                  key={s}
                  className="blueprint-mono text-[11px] px-2 py-0.5 border border-[var(--bp-panel-line)] text-[var(--bp-line-dim)]"
                >
                  {APPLICATION_STATUS_LABELS[s]}{" "}
                  <span className="tabular-nums text-[var(--bp-line)]">{count}</span>
                </span>
              ))
            )}
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="blueprint-mono text-[11px] tracking-[0.06em] uppercase bg-[var(--bp-panel)] border-[1.3px] border-[var(--bp-line)] text-[var(--bp-line)] px-4 py-2 hover:bg-[var(--bp-panel-line)] transition-colors"
          >
            {showForm ? "Close form" : "Add application"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="border border-[var(--bp-panel-line)] p-5 grid gap-4 mb-8"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-1">
                <span className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-label)]">
                  Company *
                </span>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="bg-[var(--bp-panel)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-2"
                />
              </label>
              <label className="grid gap-1">
                <span className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-label)]">
                  Role *
                </span>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="bg-[var(--bp-panel)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-2"
                />
              </label>
              <label className="grid gap-1">
                <span className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-label)]">
                  URL
                </span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-[var(--bp-panel)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-2"
                />
              </label>
              <label className="grid gap-1">
                <span className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-label)]">
                  Country
                </span>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Malaysia / Singapore / United Kingdom"
                  className="bg-[var(--bp-panel)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-2 placeholder:text-[var(--bp-line-dim)]"
                />
              </label>
              <label className="grid gap-1">
                <span className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-label)]">
                  Location
                </span>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-[var(--bp-panel)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-2"
                />
              </label>
              <label className="grid gap-1">
                <span className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-label)]">
                  Status
                </span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                  className="bg-[var(--bp-panel)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-2"
                >
                  {APPLICATION_STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {APPLICATION_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="grid gap-1">
              <span className="blueprint-mono text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-label)]">
                Notes
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="bg-[var(--bp-panel)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-2 resize-y"
              />
            </label>
            {error && (
              <p className="blueprint-mono text-[11px] text-[var(--bp-accent)]">{error}</p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="justify-self-start blueprint-mono text-[11.5px] tracking-[0.06em] uppercase bg-[var(--bp-panel)] border-[1.3px] border-[var(--bp-line)] text-[var(--bp-line)] px-5 py-2 hover:enabled:bg-[var(--bp-panel-line)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Adding…" : "Add application"}
            </button>
          </form>
        )}

        {applications === null ? (
          <p className="blueprint-mono text-[11px] text-[var(--bp-line-dim)]">Loading…</p>
        ) : applications.length === 0 ? (
          <p className="blueprint-mono text-[11px] text-[var(--bp-line-dim)]">
            Nothing here yet. Add an application, or generate a resume and &ldquo;Save to
            tracker&rdquo; from the preview.
          </p>
        ) : (
          <div className="border border-[var(--bp-panel-line)] divide-y divide-[var(--bp-panel-line)]">
            {applications.map((app) => (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                className="flex items-start justify-between gap-4 px-4 py-3 text-sm hover:bg-[var(--bp-panel)] transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[var(--bp-line)]">{app.company}</span>
                    <span className="blueprint-mono text-[10px] tracking-[0.04em] uppercase border border-[var(--bp-panel-line)] text-[var(--bp-line-dim)] px-1.5 py-0.5">
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </span>
                    {app.country && (
                      <span className="blueprint-mono text-[10px] text-[var(--bp-line-dim)]">
                        {app.country}
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--bp-line-dim)] mt-0.5">{app.role}</p>
                  <p className="blueprint-mono text-[10.5px] text-[var(--bp-line-dim)] mt-1">
                    {app.resume ? "Resume saved" : "No resume"} ·{" "}
                    {app.coverLetter ? "Cover letter saved" : "No cover letter"} · added{" "}
                    {formatDate(app.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 blueprint-mono text-[11px] text-[var(--bp-line-dim)]">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
