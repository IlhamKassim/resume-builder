import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { jobListings, jobListingsCompiledOn, type ListingType } from "@/lib/job-listings";

const TYPE_LABEL: Record<ListingType, string> = {
  direct: "Direct",
  page: "Careers page",
  program: "Program",
};

const TYPE_CLASSES: Record<ListingType, string> = {
  direct: "bg-emerald-50 text-emerald-700 border-emerald-200",
  page: "bg-gray-100 text-gray-600 border-gray-200",
  program: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function JobsPage() {
  const total = jobListings.reduce((sum, c) => sum + c.listings.length, 0);
  const compiledDate = new Date(jobListingsCompiledOn).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="mb-2">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            ← Back
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Search Dossier</h1>
          <p className="mt-1 text-gray-500">
            {total} openings compiled {compiledDate} across Malaysia, Singapore, and
            sponsorship-confirmed UK employers.
          </p>
          <p className="mt-3 text-sm text-gray-400 max-w-2xl">
            This is a one-time pull from a live web search, not a monitored feed. &ldquo;Direct&rdquo;
            links can go stale within days — &ldquo;Careers page&rdquo; links are the more durable bet
            since they always show whatever is currently open. Re-verify before applying, and for
            UK roles confirm sponsorship on the specific req.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {jobListings.map((c) => (
            <a
              key={c.country}
              href={`#${c.country.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
            >
              {c.country} ({c.listings.length})
            </a>
          ))}
        </div>

        <div className="space-y-10">
          {jobListings.map((c) => (
            <section
              key={c.country}
              id={c.country.toLowerCase().replace(/\s+/g, "-")}
              className="scroll-mt-6"
            >
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <h2 className="text-xl font-semibold text-gray-900">{c.country}</h2>
                <span className="text-xs text-gray-400">{c.listings.length} entries</span>
              </div>
              <p className="text-sm text-gray-500 mb-4 max-w-2xl">{c.blurb}</p>

              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {c.listings.map((job, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{job.company}</span>
                        <Badge variant="outline" className={TYPE_CLASSES[job.type]}>
                          {TYPE_LABEL[job.type]}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mt-0.5">
                        {job.role}
                        {job.note && <span className="text-gray-400"> — {job.note}</span>}
                      </p>
                    </div>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs font-mono text-gray-500 hover:text-gray-900 underline underline-offset-2 mt-1"
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
