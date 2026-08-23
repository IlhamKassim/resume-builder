import { z } from "zod";

export const ListingTypeSchema = z.enum(["direct", "page", "program"]);
export type ListingType = z.infer<typeof ListingTypeSchema>;

export const JobListingSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  note: z.string().optional(),
  type: ListingTypeSchema,
  url: z.string().url(),
  linkLabel: z.string().min(1),
});
export type JobListing = z.infer<typeof JobListingSchema>;

export const CountryListingsSchema = z.object({
  country: z.string().min(1),
  blurb: z.string().min(1),
  listings: z.array(JobListingSchema),
});
export type CountryListings = z.infer<typeof CountryListingsSchema>;

/** Persisted shape for the refreshable dossier (see lib/job-dossier-store.ts). The hardcoded
 * `jobListings`/`jobListingsCompiledOn` below double as the seed value used before the first
 * "Refresh Dossier" call ever writes job-listings.json. */
export const JobDossierSchema = z.object({
  compiledOn: z.string().min(1),
  countries: z.array(CountryListingsSchema),
});
export type JobDossier = z.infer<typeof JobDossierSchema>;

export const jobListingsCompiledOn = "2026-08-14";

export const jobListings: CountryListings[] = [
  {
    country: "Malaysia",
    blurb: "No visa constraint. Excludes every company already on the candidate's active application list. Mostly live careers-page and graduate-programme hubs, since specific job postings for this market tend to close within days.",
    listings: [
      { company: "MoneyLion", role: "Engineering roles", note: "KL — ML/Backend/Web Engineer seen open", type: "page", url: "https://my.jobstreet.com/companies/moneylion-168554696042330", linkLabel: "jobstreet.com" },
      { company: "GXBank", role: "All openings", note: "Grab/Singtel digital bank — mostly senior/lead reqs open right now, check regularly for junior roles", type: "page", url: "https://my.jobstreet.com/GXBank-jobs", linkLabel: "jobstreet.com" },
      { company: "ServiceNow", role: "Explore jobs", note: "KL / Cyberjaya listed", type: "page", url: "https://careers.servicenow.com/jobs/", linkLabel: "careers.servicenow.com" },
      { company: "ServiceNow", role: "Early Careers program", type: "program", url: "https://careers.servicenow.com/early-careers/", linkLabel: "careers.servicenow.com" },
      { company: "iFAST Corporation", role: "Careers — Malaysia", note: "fintech/wealth platform, Software Engineer (Java/Spring) roles seen, fresh-grad friendly", type: "page", url: "https://careers.ifastcorp.com/careers?region=my", linkLabel: "careers.ifastcorp.com" },
      { company: "Celestica", role: "All jobs — Malaysia", note: "Kulim / Johor Bahru / Senai / Bayan Lepas — dedicated Students & Graduates section", type: "page", url: "https://careers.celestica.com/go/All-Jobs-Malaysia/8972901/", linkLabel: "careers.celestica.com" },
      { company: "Microsoft", role: "Recent graduate opportunities", note: "global hub, filter to Malaysia", type: "program", url: "https://careers.microsoft.com/v2/global/en/recentgraduate", linkLabel: "careers.microsoft.com" },
      { company: "Axiata", role: "Axiata Graduate Programme (AGP)", note: "18-month rotational programme, min CGPA 3.3", type: "program", url: "https://www.axiata.com/talent/axiatagraduateprogramme/", linkLabel: "axiata.com" },
      { company: "Setel", role: "Careers", note: "mobility/fintech super-app — fuel, e-wallet, insurance", type: "page", url: "https://www.setel.com/careers", linkLabel: "setel.com" },
      { company: "Curlec (Razorpay)", role: "Careers", note: "payments fintech, Software Developer roles seen", type: "page", url: "https://curlec.com/careers/", linkLabel: "curlec.com" },
      { company: "Supahands", role: "Careers — current openings", note: "AI-adjacent, Bangsar South", type: "page", url: "https://www.supahands.ai/careers", linkLabel: "supahands.ai" },
      { company: "StoreHub", role: "Graduate programs & internships", note: "SEA retail/restaurant SaaS platform", type: "program", url: "https://my.prosple.com/graduate-employers/storehub", linkLabel: "prosple.com" },
      { company: "BJAK", role: "Current openings", note: "SEA insurance portal — AI/ML, backend (NodeJS), frontend (React/Next.js) roles seen", type: "page", url: "https://jobs.ashbyhq.com/bjakcareer", linkLabel: "jobs.ashbyhq.com" },
    ],
  },
  {
    country: "Singapore",
    blurb: "No visa constraint. Excludes every company already on the candidate's active application list. Strong fintech/payments density (Airwallex, Xendit, Nium, Endowus, Coinbase) alongside GovTech's structured tech-associate track.",
    listings: [
      { company: "GovTech", role: "All careers", type: "page", url: "https://www.tech.gov.sg/careers/", linkLabel: "tech.gov.sg" },
      { company: "GovTech", role: "Students & Graduates programs", type: "program", url: "https://www.tech.gov.sg/careers/students-and-graduates/", linkLabel: "tech.gov.sg" },
      { company: "PropertyGuru", role: "All openings", note: "Workday search — a \"Graduate Engineer\" req has been seen listed", type: "page", url: "https://propertyguru.wd105.myworkdayjobs.com/PropertyGuru", linkLabel: "myworkdayjobs.com" },
      { company: "Ninja Van", role: "Careers", note: "explicitly fresh-grad friendly", type: "page", url: "https://www.ninjavan.co/en-sg/company/careers", linkLabel: "ninjavan.co" },
      { company: "PayPal", role: "University Hiring — Asia-Pacific", type: "program", url: "https://careers.pypl.com/university-hiring/asia-pacific/", linkLabel: "careers.pypl.com" },
      { company: "Airwallex", role: "Careers", note: "global payments/fintech platform, HQ presence in SG", type: "page", url: "https://careers.airwallex.com/", linkLabel: "careers.airwallex.com" },
      { company: "Xendit", role: "Careers", note: "SEA payments infrastructure", type: "page", url: "https://www.xendit.co/en/careers/", linkLabel: "xendit.co" },
      { company: "Nium", role: "Careers", note: "cross-border payments infrastructure", type: "page", url: "https://www.nium.com/careers", linkLabel: "nium.com" },
      { company: "Endowus", role: "Careers", note: "MAS-licensed digital wealth platform — web (React/TS) and mobile (Flutter) roles seen", type: "page", url: "https://endowus.com/careers", linkLabel: "endowus.com" },
      { company: "Coinbase", role: "All positions", note: "filter to Singapore — has a Software Engineer, Emerging Talent track", type: "page", url: "https://www.coinbase.com/careers/positions", linkLabel: "coinbase.com" },
      { company: "Hudson River Trading", role: "Software Engineer (C++ or Python) — 2027 Grads", note: "quant trading firm, Singapore listed as a location, verified open", type: "direct", url: "https://www.hudsonrivertrading.com/hrt-job/software-engineer-c-or-python-2027-grads/", linkLabel: "hudsonrivertrading.com" },
      { company: "Klook", role: "Careers", note: "R&D/engineering hub spans Singapore and Shenzhen", type: "page", url: "https://www.klook.com/careers/", linkLabel: "klook.com" },
    ],
  },
  {
    country: "United Kingdom",
    blurb: "Sponsorship-confirmed employers only, excluding every company already on the candidate's active application list. Still verify sponsorship on the specific req — policy can vary by team even within a sponsoring company.",
    listings: [
      { company: "Palantir", role: "Students & Early Talent hub", type: "page", url: "https://www.palantir.com/careers/students-and-early-talent/", linkLabel: "palantir.com" },
      { company: "Bloomberg", role: "Graduate Program — UK", type: "program", url: "https://uk.prosple.com/graduate-employers/bloomberg-uk/jobs-internships/graduate-program", linkLabel: "prosple.com" },
      { company: "Arm", role: "Graduate Program hub", type: "program", url: "https://careers.arm.com/graduates", linkLabel: "careers.arm.com" },
      { company: "Darktrace", role: "Careers", note: "cybersecurity AI, Cambridge-founded", type: "page", url: "https://www.darktrace.com/careers", linkLabel: "darktrace.com" },
      { company: "Checkout.com", role: "Careers", type: "page", url: "https://www.checkout.com/careers", linkLabel: "checkout.com" },
      { company: "Ocado Technology", role: "Graduate programmes", note: "software engineering track runs four 6-month rotational placements", type: "program", url: "https://careers.ocadogroup.com/teams/early-careers/graduates", linkLabel: "careers.ocadogroup.com" },
      { company: "Monzo", role: "Careers", note: "no formal grad scheme — rolling reqs", type: "page", url: "https://monzo.com/careers", linkLabel: "monzo.com" },
      { company: "Databricks", role: "Open positions", note: "UK — AI/Forward Deployed Engineer roles seen open", type: "page", url: "https://www.databricks.com/company/careers/open-positions", linkLabel: "databricks.com" },
      { company: "G-Research", role: "Vacancies", note: "quant research/tech firm — the specific 2026 graduate cohort req has closed, but SWE reqs open on a rolling basis", type: "page", url: "https://www.gresearch.com/vacancies/", linkLabel: "gresearch.com" },
      { company: "Man Group", role: "Graduate Programmes", note: "18–24 month rotational Technology stream (Analysis, Engineering, Infrastructure)", type: "program", url: "https://www.man.com/graduate-programmes", linkLabel: "man.com" },
      { company: "Improbable", role: "All jobs", type: "page", url: "https://jobs.ashbyhq.com/improbable", linkLabel: "jobs.ashbyhq.com" },
      { company: "Qube Research & Technologies (QRT)", role: "Careers", note: "systematic investment manager, licensed UK visa sponsor", type: "page", url: "https://www.qube-rt.com/careers/", linkLabel: "qube-rt.com" },
      { company: "Hudson River Trading", role: "Software Engineer (C++ or Python) — 2027 Grads", note: "quant trading firm, London listed as a location, verified open", type: "direct", url: "https://www.hudsonrivertrading.com/hrt-job/software-engineer-c-or-python-2027-grads/", linkLabel: "hudsonrivertrading.com" },
    ],
  },
];
