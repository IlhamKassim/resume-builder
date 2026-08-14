"use client";

interface Props {
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function JobDescriptionInput({
  jobDescription,
  onJobDescriptionChange,
  onGenerate,
  isGenerating,
}: Props) {
  return (
    <div className="border border-[var(--bp-panel-line)] p-6 grid gap-4.5">
      <div>
        <label
          htmlFor="jobDescription"
          className="blueprint-mono block text-[10.5px] tracking-[0.08em] uppercase text-[var(--bp-label)] mb-2"
        >
          Input — Job Description (Free Text)
        </label>
        <textarea
          id="jobDescription"
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          placeholder="We are looking for a Software Engineer…"
          rows={10}
          className="w-full min-h-[92px] bg-[var(--bp-panel)] border border-[var(--bp-panel-line)] text-[var(--bp-line)] text-sm p-3 resize-none placeholder:text-[var(--bp-line-dim)] focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-[var(--bp-accent)] focus-visible:outline-offset-1"
        />
        <p className="blueprint-mono text-[11px] text-[var(--bp-line-dim)] mt-2">
          Paste the full job posting. The more detail, the better the tailoring.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onGenerate}
          disabled={!jobDescription.trim() || isGenerating}
          className="relative blueprint-mono text-[11.5px] tracking-[0.06em] uppercase bg-[var(--bp-panel)] border-[1.3px] border-[var(--bp-line)] text-[var(--bp-line)] px-5 py-2.5 transition-[transform,background-color] hover:enabled:bg-[var(--bp-panel-line)] active:enabled:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed before:content-[''] before:absolute before:left-[-1.3px] before:top-[-1.3px] before:bottom-[-1.3px] before:w-1 before:bg-[var(--bp-accent)] before:opacity-0 data-[armed=true]:before:opacity-100"
          data-armed={isGenerating}
        >
          {isGenerating ? "Engine engaged…" : "Actuate — Generate Resume"}
        </button>

        {isGenerating && (
          <span className="blueprint-mono text-[11px] text-[var(--bp-accent)]">
            This takes about 10–15 seconds
          </span>
        )}
      </div>
    </div>
  );
}
