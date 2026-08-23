"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshDossierButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/job-dossier", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Could not refresh the dossier.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not refresh the dossier.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="shrink-0 flex flex-col items-end gap-1">
      <button
        onClick={refresh}
        disabled={loading}
        className="blueprint-mono text-[11px] tracking-[0.04em] uppercase border border-[var(--bp-panel-line)] text-[var(--bp-line-dim)] px-3 py-1.5 hover:border-[var(--bp-accent)] hover:text-[var(--bp-accent)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {loading ? "Searching the web…" : "Refresh dossier ↻"}
      </button>
      {error && (
        <span className="blueprint-mono text-[10px] text-[var(--bp-accent)] max-w-[220px] text-right">
          {error}
        </span>
      )}
    </span>
  );
}
