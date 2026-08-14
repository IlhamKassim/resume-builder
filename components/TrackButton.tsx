"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  APPLICATION_STATUS_LABELS,
  type Application,
  type ApplicationStatus,
} from "@/lib/applications";

interface Props {
  company: string;
  role: string;
  url: string;
  country: string;
  note?: string;
}

export function TrackButton({ company, role, url, country, note }: Props) {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/applications");
        if (!res.ok) return;
        const list = (await res.json()) as Application[];
        if (cancelled) return;
        setApp(list.find((a) => a.url === url) ?? null);
      } catch {
        // Tracking is optional; a fetch failure just leaves the button untracked.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  async function track() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          url,
          country,
          status: "applied" satisfies ApplicationStatus,
          notes: note ?? "",
        }),
      });
      if (!res.ok) {
        setError("Could not track this listing.");
        return;
      }
      setApp(await res.json());
    } catch {
      setError("Could not track this listing.");
    } finally {
      setLoading(false);
    }
  }

  if (app) {
    return (
      <Link
        href={`/applications/${app.id}`}
        className="shrink-0 blueprint-mono text-[11px] tracking-[0.04em] uppercase border border-[var(--bp-accent)] text-[var(--bp-accent)] px-2 py-1 hover:bg-[var(--bp-panel-line)] transition-colors mt-1"
      >
        {APPLICATION_STATUS_LABELS[app.status]} ↗
      </Link>
    );
  }

  return (
    <span className="shrink-0 flex flex-col items-end gap-1">
      <button
        onClick={track}
        disabled={loading}
        className="blueprint-mono text-[11px] tracking-[0.04em] uppercase border border-[var(--bp-panel-line)] text-[var(--bp-line-dim)] px-2 py-1 hover:border-[var(--bp-accent)] hover:text-[var(--bp-accent)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
      >
        {loading ? "Saving…" : "Mark applied"}
      </button>
      {error && (
        <span className="blueprint-mono text-[10px] text-[var(--bp-accent)]">{error}</span>
      )}
    </span>
  );
}
