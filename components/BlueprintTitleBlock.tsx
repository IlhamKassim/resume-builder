import { BlueprintThemeToggle } from "@/components/BlueprintThemeToggle";

interface Props {
  dwgNo: string;
  rev: string;
  title: string;
  subtitle: string;
  backHref?: string;
  onBack?: () => void;
}

export function BlueprintTitleBlock({ dwgNo, rev, title, subtitle, backHref, onBack }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div className="border border-[var(--bp-panel-line)] grid grid-cols-[1fr_auto] flex-1 min-w-0">
        <div className="p-5 border-r border-[var(--bp-panel-line)] min-w-0">
          {(backHref || onBack) && (
            <a
              href={backHref ?? "#"}
              onClick={onBack}
              className="blueprint-mono text-[11px] tracking-[0.08em] uppercase text-[var(--bp-label)] hover:text-[var(--bp-accent)] transition-colors inline-block mb-3"
            >
              ← Back
            </a>
          )}
          <h1 className="text-[clamp(22px,3.4vw,30px)] font-normal leading-tight text-wrap-balance mb-1.5">
            {title}
          </h1>
          <p className="blueprint-mono text-[12.5px] text-[var(--bp-line-dim)]">{subtitle}</p>
        </div>
        <div className="blueprint-mono text-[11px] hidden sm:grid grid-rows-2 min-w-[170px]">
          <div className="px-4 py-2 border-b border-[var(--bp-panel-line)] flex justify-between gap-3">
            <span className="text-[var(--bp-line-dim)] tracking-[0.06em]">Dwg No.</span>
            <span className="tabular-nums">{dwgNo}</span>
          </div>
          <div className="px-4 py-2 flex justify-between gap-3">
            <span className="text-[var(--bp-line-dim)] tracking-[0.06em]">Rev.</span>
            <span className="tabular-nums">{rev}</span>
          </div>
        </div>
      </div>
      <BlueprintThemeToggle />
    </div>
  );
}
