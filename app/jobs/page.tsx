import { BlueprintTitleBlock } from "@/components/BlueprintTitleBlock";
import { jobListings, jobListingsCompiledOn, type ListingType } from "@/lib/job-listings";

const TYPE_LABEL: Record<ListingType, string> = {
  direct: "Direct",
  page: "Careers page",
  program: "Program",
};

const TYPE_CLASSES: Record<ListingType, string> = {
  direct: "border-[var(--bp-accent)] text-[var(--bp-accent)]",
  page: "border-[var(--bp-panel-line)] text-[var(--bp-line-dim)]",
  program: "border-[var(--bp-line-dim)] text-[var(--bp-label)]",
};

export default function JobsPage() {
  const total = jobListings.reduce((sum, c) => sum + c.listings.length, 0);
  const compiledDate = new Date(jobListingsCompiledOn).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="blueprint-sheet">
      <div className="max-w-[920px] mx-auto py-10 px-6 pb-24">
        <BlueprintTitleBlock
          dwgNo="RB-2026-02"
          rev="A"
          title="Job Search Dossier"
          subtitle={`${total} openings — MY / SG / UK (sponsored)`}
          backHref="/"
        />

        <p className="blueprint-mono text-[11.5px] text-[var(--bp-line-dim)] max-w-[62ch] mb-8 -mt-4">
          Compiled {compiledDate} from a live web search — not a monitored feed. &ldquo;Direct&rdquo;{" "}
          links can go stale within days; &ldquo;Careers page&rdquo; links are the more durable bet
          since they always show whatever is currently open. Re-verify before applying, and for UK
          roles confirm sponsorship on the specific req.
        </p>

        <div className="flex flex-wrap gap-2 mb-10">
          {jobListings.map((c) => (
            <a
              key={c.country}
              href={`#${c.country.toLowerCase().replace(/\s+/g, "-")}`}
              className="blueprint-mono text-[11px] tracking-[0.04em] uppercase px-3 py-1.5 border border-[var(--bp-panel-line)] text-[var(--bp-label)] hover:border-[var(--bp-accent)] hover:text-[var(--bp-accent)] transition-colors"
            >
              {c.country} ({c.listings.length})
            </a>
          ))}
        </div>

        <div className="space-y-12">
          {jobListings.map((c, ci) => (
            <section
              key={c.country}
              id={c.country.toLowerCase().replace(/\s+/g, "-")}
              className="scroll-mt-6"
            >
              <p className="blueprint-mono text-[11px] tracking-[0.1em] uppercase text-[var(--bp-accent)] mb-1">
                Fig. {ci + 1}
              </p>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <h2 className="text-[20px] font-normal">{c.country}</h2>
                <span className="blueprint-mono text-[11px] text-[var(--bp-line-dim)]">
                  {c.listings.length} entries
                </span>
              </div>
              <p className="text-[13.5px] text-[var(--bp-line-dim)] mb-4 max-w-[64ch]">{c.blurb}</p>

              <div className="border border-[var(--bp-panel-line)] divide-y divide-[var(--bp-panel-line)]">
                {c.listings.map((job, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[var(--bp-line)]">{job.company}</span>
                        <span
                          className={`blueprint-mono text-[10px] tracking-[0.04em] uppercase border px-1.5 py-0.5 ${TYPE_CLASSES[job.type]}`}
                        >
                          {TYPE_LABEL[job.type]}
                        </span>
                      </div>
                      <p className="text-[var(--bp-line-dim)] mt-0.5">
                        <span className="text-[var(--bp-line)]">{job.role}</span>
                        {job.note && <span> — {job.note}</span>}
                      </p>
                    </div>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 blueprint-mono text-[11.5px] text-[var(--bp-line-dim)] hover:text-[var(--bp-accent)] underline underline-offset-2 mt-1"
                    >
                      {job.linkLabel} ↗
                    </a>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
