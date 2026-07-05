"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function systemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function BlueprintThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Reading localStorage/matchMedia must happen post-mount to avoid a
    // server/client hydration mismatch — theme starts null so the first
    // client render matches the server render before this runs.
    const stored = window.localStorage.getItem("bp-theme") as Theme | null;
    const initial = stored ?? systemTheme();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("bp-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="blueprint-mono text-[11px] tracking-[0.05em] uppercase border border-[var(--bp-panel-line)] text-[var(--bp-label)] hover:border-[var(--bp-accent)] hover:text-[var(--bp-accent)] px-2.5 py-1.5 rounded-sm transition-colors"
    >
      {theme === "light" ? "Blackline / Diazo" : "Cyanotype / Blueprint"}
    </button>
  );
}
