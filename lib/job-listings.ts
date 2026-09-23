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
    "country": "Malaysia",
    "blurb": "No visa constraint. Excludes every company already on the candidate active application list. Company-direct career sites and single-company ATS portals only.",
    "listings": [
      {
        "company": "Experian Malaysia",
        "role": "Associate Developer (Java)",
        "note": "Fintech & global data intelligence hub in Cyberjaya; live entry-level Java developer opening on Experian SmartRecruiters ATS",
        "type": "direct",
        "url": "https://jobs.smartrecruiters.com/Experian/744000147591879",
        "linkLabel": "smartrecruiters.com"
      },
      {
        "company": "Experian Malaysia",
        "role": "Software Engineer I",
        "note": "Cyberjaya Global Development Centre; live entry-level full SDLC engineering req across Java/Node.js/APIs on SmartRecruiters",
        "type": "direct",
        "url": "https://jobs.smartrecruiters.com/Experian/744000147095609",
        "linkLabel": "smartrecruiters.com"
      },
      {
        "company": "Experian Malaysia",
        "role": "Graduate Program in Technology & Analytics",
        "note": "Structured early-career technology & analytics development programme based at Cyberjaya GDC",
        "type": "program",
        "url": "https://jobs.smartrecruiters.com/Experian/744000146915119",
        "linkLabel": "smartrecruiters.com"
      },
      {
        "company": "Keysight Technologies",
        "role": "R&D Software Engineer - Full Stack & Solution Architecture",
        "note": "Penang R&D centre; live req #53406 for web full-stack architecture, React UI, and test systems automation on Keysight jobs portal",
        "type": "direct",
        "url": "https://jobs.keysight.com/external/jobs/53406?lang=en-us",
        "linkLabel": "keysight.com"
      },
      {
        "company": "Willowglen MSC Berhad",
        "role": "Web Developer / Software Engineer (Project)",
        "note": "Industrial SCADA & IoT systems; direct application portal listing ~16 engineering openings explicitly welcoming fresh graduates",
        "type": "page",
        "url": "https://www.willowglen.com.my/career-at-willowglen",
        "linkLabel": "willowglen.com.my"
      },
      {
        "company": "Pentamaster Corporation Berhad",
        "role": "Software Engineer / Firmware Engineer",
        "note": "Penang-based automated inspection & robotics firm; direct careers portal listing junior software engineer and firmware architecture roles",
        "type": "page",
        "url": "https://pentamaster.com.my/career/",
        "linkLabel": "pentamaster.com.my"
      },
      {
        "company": "ViTrox Technologies",
        "role": "R&D Software Engineer / Software Test Engineer",
        "note": "Batu Kawan, Penang tech champion; direct jobs portal listing machine vision, test automation, and embedded R&D software positions",
        "type": "page",
        "url": "https://jobs.vitrox.com/index.php",
        "linkLabel": "vitrox.com"
      },
      {
        "company": "JurisTech (Juris Technologies)",
        "role": "Software Engineer / Junior Developer",
        "note": "Enterprise banking & fintech software house (KL); direct careers portal listing full-stack software engineer vacancies",
        "type": "page",
        "url": "https://juristech.net/careers/join-us/",
        "linkLabel": "juristech.net"
      },
      {
        "company": "Deriv",
        "role": "Software Engineer / Early Career Technology Roles",
        "note": "Fintech trading platform (Cyberjaya/Labuan); direct careers hub for full-stack, AI, and trading platform development",
        "type": "page",
        "url": "https://careers.deriv.com/",
        "linkLabel": "deriv.com"
      },
      {
        "company": "Hong Leong Bank",
        "role": "Graduate Trainee Program (IT & Digital Banking tracks)",
        "note": "Structured banking graduate program with dedicated Information Technology, digital banking, and software engineering rotational tracks",
        "type": "program",
        "url": "https://www.hlb.com.my/en/personal-banking/about-us/careers/graduate-trainee-program.html",
        "linkLabel": "hlb.com.my"
      },
      {
        "company": "Standard Chartered GBS Malaysia",
        "role": "Technology Graduate Programme",
        "note": "Global business & engineering services hub at TPM Bukit Jalil; structured global intake for software engineering and cloud infrastructure",
        "type": "program",
        "url": "https://www.sc.com/en/global-careers/early-careers/our-programmes/graduates/",
        "linkLabel": "sc.com"
      },
      {
        "company": "DHL IT Services Cyberjaya",
        "role": "Software Engineering & Technology Roles",
        "note": "One of DHL three global IT hubs (Cyberjaya); direct portal for core software engineering, Java, cloud solutions, and systems design",
        "type": "page",
        "url": "https://careers.dhl.com/global/en/it-services",
        "linkLabel": "dhl.com"
      },
      {
        "company": "Accenture Malaysia",
        "role": "Technology Consulting & Software Development",
        "note": "Kuala Lumpur office; direct technology careers hub for custom software development, cloud, and systems integration",
        "type": "page",
        "url": "https://www.accenture.com/my-en/careers",
        "linkLabel": "accenture.com"
      }
    ]
  },
  {
    "country": "Singapore",
    "blurb": "Sponsorship-confirmed employers only, excluding every company already on the candidate active application list. Requires clearing the MOM Employment Pass qualifying salary floor (S$5,600/month, S$6,200 for financial services) and COMPASS framework points.",
    "listings": [
      {
        "company": "Tower Research Capital",
        "role": "Software Engineer (Full Stack / Python / React / Linux)",
        "note": "Quantitative trading firm (Raffles Place); live req #7613150 for full-stack developer (Python, React, Linux); confirmed EP sponsor well above salary floor",
        "type": "direct",
        "url": "https://www.tower-research.com/open-positions/?gh_jid=7613150",
        "linkLabel": "tower-research.com"
      },
      {
        "company": "Squarepoint Capital",
        "role": "Graduate Software Developer (Singapore)",
        "note": "Quantitative investment firm; live req #6040910 covering Python, C++, or React/TypeScript front-end tracks; confirmed EP sponsor for foreign STEM grads",
        "type": "direct",
        "url": "https://www.squarepoint-capital.com/open-opportunities?id=6040910&gh_jid=6040910",
        "linkLabel": "squarepoint-capital.com"
      },
      {
        "company": "Optiver",
        "role": "Graduate Software Engineer (Singapore)",
        "note": "Proprietary trading / market-making firm; confirmed Employment Pass sponsorship and relocation support for foreign grads (C++/Python); ~8-month cool-off between applications",
        "type": "page",
        "url": "https://www.optiver.com/working-at-optiver/career-opportunities/",
        "linkLabel": "optiver.com"
      },
      {
        "company": "Flow Traders",
        "role": "Graduate Software Engineer (Singapore)",
        "note": "Global quantitative trading firm; confirmed full Employment Pass sponsorship plus flight and initial accommodation for graduate SWE hires",
        "type": "page",
        "url": "https://www.flowtraders.com/careers",
        "linkLabel": "flowtraders.com"
      },
      {
        "company": "Amazon (AWS)",
        "role": "Software Development Engineer \u2014 University Talent / Early Career",
        "note": "Amazon University Talent Acquisition (AUTA) routinely sponsors Employment Passes and provides relocation for qualified entry-level SDE hires in Singapore",
        "type": "program",
        "url": "https://www.amazon.jobs/content/en/career-programs/university",
        "linkLabel": "amazon.jobs"
      },
      {
        "company": "DRW",
        "role": "Software Engineer \u2014 Campus",
        "note": "Quant trading firm; routinely sponsors Employment Passes for qualified quantitative/low-latency SWE graduates, compensation well above the EP salary floor",
        "type": "page",
        "url": "https://drw.com/work-at-drw/listings",
        "linkLabel": "drw.com"
      },
      {
        "company": "Virtu Financial",
        "role": "Quantitative & Software Systems Engineering",
        "note": "Global electronic market maker; confirmed EP sponsor for software and trading systems developers in Singapore",
        "type": "page",
        "url": "https://www.virtu.com/careers/",
        "linkLabel": "virtu.com"
      },
      {
        "company": "Akuna Capital",
        "role": "Trade Support Engineer / Quantitative Technology",
        "note": "Derivatives market-making firm; confirmed EP sponsor for technical graduates and engineers, compensation well above MOM threshold",
        "type": "page",
        "url": "https://akunacapital.com/careers/",
        "linkLabel": "akunacapital.com"
      },
      {
        "company": "Morgan Stanley",
        "role": "Technology Full-Time Analyst Programme (Singapore)",
        "note": "Global financial firm; confirmed Employment Pass sponsor for overseas STEM university graduates joining Singapore technology cohorts",
        "type": "program",
        "url": "https://www.morganstanley.com/people-opportunities/students-graduates/",
        "linkLabel": "morganstanley.com"
      },
      {
        "company": "Goldman Sachs",
        "role": "New Analyst Programme \u2014 Engineering (Singapore)",
        "note": "Mapletree Anson tech hub; routinely sponsors Employment Passes for international engineering analysts meeting COMPASS qualification points",
        "type": "program",
        "url": "https://www.goldmansachs.com/careers/students/programs-and-internships",
        "linkLabel": "goldmansachs.com"
      },
      {
        "company": "Balyasny Asset Management (BAM)",
        "role": "Quantitative Development & Technology",
        "note": "Multi-strategy hedge fund (Singapore office); hires and sponsors international technical talent well above the EP salary threshold",
        "type": "page",
        "url": "https://www.bamfunds.com/careers",
        "linkLabel": "bamfunds.com"
      }
    ]
  },
  {
    "country": "United Kingdom",
    "blurb": "Sponsorship-confirmed employers only, excluding every company already on the candidate active application list. Offshore US graduates (Penn State) cannot use the UK Graduate Visa (PSW) and require direct Skilled Worker visa sponsorship from abroad.",
    "listings": [
      {
        "company": "Optiver",
        "role": "Graduate Software Engineer (London)",
        "note": "Global proprietary trading firm / market maker; live London req explicitly states visa sponsorship where necessary for expats and relocation packages; A-rated sponsor on GOV.UK register",
        "type": "direct",
        "url": "https://www.optiver.com/join-us/jobs/technology/london/graduate-software-engineer/",
        "linkLabel": "optiver.com"
      },
      {
        "company": "Goldman Sachs",
        "role": "New Analyst Programme \u2014 Engineering (London)",
        "note": "Full-time graduate entry-level program; A-rated licensed Skilled Worker sponsor (Goldman Sachs International) routinely sponsoring international engineering cohorts",
        "type": "program",
        "url": "https://www.goldmansachs.com/careers/students/programs-and-internships/emea/new-analyst-programme",
        "linkLabel": "goldmansachs.com"
      },
      {
        "company": "TPP (The Phoenix Partnership)",
        "role": "Graduate Software Developer",
        "note": "Healthcare tech firm (\u00a360,000 starting salary); official FAQ confirms Skilled Worker visa sponsorship; caveat: requires in-person testing & interview in Leeds (travel not reimbursed)",
        "type": "direct",
        "url": "https://tpp-careers.com/roles/software-developer/",
        "linkLabel": "tpp-careers.com"
      },
      {
        "company": "Susquehanna International Group (SIG)",
        "role": "Software Developer Graduate (London)",
        "note": "Quantitative trading firm (London); live graduate req #11336 on SIG careers portal; confirmed A-rated Skilled Worker sponsor on GOV.UK register",
        "type": "direct",
        "url": "https://careers.sig.com/jobs/11336?lang=en-us",
        "linkLabel": "sig.com"
      },
      {
        "company": "Squarepoint Capital",
        "role": "Graduate Software Developer (London)",
        "note": "Global quant trading firm; live London graduate req #6040910 for Python, C++, or React/TypeScript front-end tracks; confirmed A-rated Skilled Worker sponsor",
        "type": "direct",
        "url": "https://www.squarepoint-capital.com/open-opportunities?id=6040910&gh_jid=6040910",
        "linkLabel": "squarepoint-capital.com"
      },
      {
        "company": "Amazon UK",
        "role": "Software Development Engineer \u2014 Student Programs / Early Career",
        "note": "Amazon University Talent Acquisition (AUTA) routinely sponsors Skilled Worker visas for graduate SDE hires across London, Cambridge, and Edinburgh; A-rated sponsor",
        "type": "program",
        "url": "https://www.amazon.jobs/content/en/career-programs/university",
        "linkLabel": "amazon.jobs"
      },
      {
        "company": "Morgan Stanley",
        "role": "Technology Full-Time Analyst Programme (London)",
        "note": "Licensed UK sponsor (Morgan Stanley UK Limited); routinely sponsors overseas STEM grads directly on Skilled Worker visas for London Technology Analyst cohorts",
        "type": "program",
        "url": "https://www.morganstanley.com/people-opportunities/students-graduates/",
        "linkLabel": "morganstanley.com"
      },
      {
        "company": "FDM Group",
        "role": "Software Engineering Graduate Programme",
        "note": "Confirmed as a licensed UK Skilled Worker visa sponsor (A-rated) on the GOV.UK Register of Licensed Sponsors",
        "type": "program",
        "url": "https://www.fdmgroup.com/candidates/graduate-programme/",
        "linkLabel": "fdmgroup.com"
      },
      {
        "company": "IBM UK Ltd",
        "role": "Early-careers technology roles (software/consulting)",
        "note": "Licensed UK visa sponsor; active graduate developer openings (e.g. Hursley), sponsorship is role-dependent and requires recruiter verification",
        "type": "program",
        "url": "https://www.ibm.com/careers/uk-en/entry-level/",
        "linkLabel": "ibm.com"
      },
      {
        "company": "FactSet Europe Limited",
        "role": "Graduate Software Engineer (London)",
        "note": "Financial data & software platform; confirmed A-rated Skilled Worker sponsor on GOV.UK (FactSet Europe Limited); routinely issues Skilled Worker visas for London technology engineering roles",
        "type": "page",
        "url": "https://www.factset.com/careers",
        "linkLabel": "factset.com"
      },
      {
        "company": "Tower Research Capital",
        "role": "Quantitative Trading & Technology Roles (London)",
        "note": "High-frequency trading firm; confirmed A-rated Skilled Worker sponsor on GOV.UK (Tower Research Capital Europe Limited); compensation well clears threshold",
        "type": "page",
        "url": "https://www.tower-research.com/open-positions",
        "linkLabel": "tower-research.com"
      }
    ]
  }
];
