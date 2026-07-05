export type ListingType = "direct" | "page" | "program";

export interface JobListing {
  company: string;
  role: string;
  note?: string;
  type: ListingType;
  url: string;
  linkLabel: string;
}

export interface CountryListings {
  country: string;
  blurb: string;
  listings: JobListing[];
}

export const jobListingsCompiledOn = "2026-07-06";

export const jobListings: CountryListings[] = [
  {
    country: "Malaysia",
    blurb: "No visa constraint. Mix of specific open roles and the employer's live careers page where a single req wasn't pinned down.",
    listings: [
      { company: "Onepoint", role: "Software Engineer", note: "Kuala Lumpur", type: "direct", url: "https://www.linkedin.com/jobs/view/software-engineer-at-onepoint-3442457491", linkLabel: "linkedin.com/jobs" },
      { company: "Carsome", role: "Backend Software Engineer", note: "fresh grads encouraged", type: "direct", url: "https://prosple.com/graduate-employers/carsome-malaysia/jobs-internships/software-engineer-back-end", linkLabel: "prosple.com" },
      { company: "Carsome", role: "Front-End Software Engineer", type: "direct", url: "https://my.hiredly.com/jobs/jobs-malaysia-carsome-job-software-engineer-se-front-end", linkLabel: "hiredly.com" },
      { company: "Grab", role: "Software Engineer roles", note: "all Malaysia openings", type: "page", url: "https://www.grab.careers/en/jobs/", linkLabel: "grab.careers" },
      { company: "Grab", role: "Malaysia listings", note: "via Jobstreet", type: "page", url: "https://my.jobstreet.com/grab-malaysia-jobs", linkLabel: "jobstreet.com" },
      { company: "Shopee", role: "Job positions", note: "engineering + other", type: "page", url: "https://careers.shopee.com.my/jobs", linkLabel: "careers.shopee.com.my" },
      { company: "Shopee", role: "Graduate Development Program", type: "program", url: "https://my.prosple.com/graduate-employers/shopee-malaysia/jobs-internships/graduate-development-program", linkLabel: "prosple.com" },
      { company: "AirAsia", role: "Tech roles", note: "Backend / SE II / Staff Engineer seen open", type: "page", url: "https://careers.airasia.com/", linkLabel: "careers.airasia.com" },
      { company: "PETRONAS", role: "Fresh Graduate — Software Engineering", type: "program", url: "https://my.prosple.com/graduate-employers/petroliam-nasional-berhad/jobs-internships/fresh-graduate-software-engineering", linkLabel: "prosple.com" },
      { company: "CIMB", role: "Fresh Graduate careers", type: "page", url: "https://www.cimb.com/en/careers/fresh-graduate.html", linkLabel: "cimb.com" },
      { company: "Maybank", role: "Graduate programs", type: "program", url: "https://my.prosple.com/graduate-employers/maybank-malaysia", linkLabel: "prosple.com" },
      { company: "MoneyLion", role: "Engineering roles", note: "KL — ML/Backend/Web Engineer seen open", type: "page", url: "https://my.jobstreet.com/companies/moneylion-168554696042330", linkLabel: "jobstreet.com" },
      { company: "ServiceNow", role: "Explore jobs", note: "KL / Cyberjaya listed", type: "page", url: "https://careers.servicenow.com/jobs/", linkLabel: "careers.servicenow.com" },
      { company: "ServiceNow", role: "Early Careers program", type: "program", url: "https://careers.servicenow.com/early-careers/", linkLabel: "careers.servicenow.com" },
      { company: "Supahands", role: "Software Engineer", note: "AI-adjacent, Bangsar South", type: "direct", url: "https://jobs.weekday.works/supahands-software-engineer", linkLabel: "jobs.weekday.works" },
      { company: "Supahands", role: "Careers — current openings", type: "page", url: "https://www.supahands.ai/careers", linkLabel: "supahands.ai" },
    ],
  },
  {
    country: "Singapore",
    blurb: "No visa constraint. Strong concentration of structured graduate programs (Sea/Shopee MAP, DBS MA, GovTech Associate) that explicitly welcome new grads.",
    listings: [
      { company: "Shopee / Monee", role: "Graduate Development Program (GDP)", type: "direct", url: "https://careers.shopee.sg/job-detail/125608", linkLabel: "careers.shopee.sg" },
      { company: "Shopee", role: "Job positions", type: "page", url: "https://careers.shopee.sg/jobs", linkLabel: "careers.shopee.sg" },
      { company: "Shopee", role: "Tech at Shopee", note: "engineering-specific hub", type: "page", url: "https://careers.shopee.sg/tech", linkLabel: "careers.shopee.sg" },
      { company: "Sea (Garena/Shopee/Monee)", role: "2026 Global Management Associate Program", type: "direct", url: "https://career.sea.com/position/J02045988", linkLabel: "career.sea.com" },
      { company: "Sea", role: "All open roles", type: "page", url: "https://career.sea.com/search", linkLabel: "career.sea.com" },
      { company: "GovTech", role: "Software Engineer (Full Stack), AI Programme", type: "direct", url: "https://jobs.careers.gov.sg/jobs/hrp/16708421/005056a3-d347-1fe0-ac89-b910a7d0e280", linkLabel: "careers.gov.sg" },
      { company: "GovTech", role: "Software Engineer (Salesforce), Digital Transformation", type: "direct", url: "https://jobs.careers.gov.sg/jobs/hrp/15639670/005056a3-d347-1fe0-a580-8147bb1dc278", linkLabel: "careers.gov.sg" },
      { company: "GovTech", role: "Students & Graduates programs", type: "program", url: "https://www.tech.gov.sg/careers/students-and-graduates/", linkLabel: "tech.gov.sg" },
      { company: "DBS Bank", role: "Management Associate Programme", note: "Tech & Data track available", type: "program", url: "https://www.dbs.com/careers/management-associate-programme/singapore", linkLabel: "dbs.com" },
      { company: "DBS Bank", role: "All careers", type: "page", url: "https://www.dbs.com/careers/default.page", linkLabel: "dbs.com" },
      { company: "ByteDance", role: "Early Careers — students", type: "page", url: "https://jobs.bytedance.com/en/students", linkLabel: "jobs.bytedance.com" },
      { company: "ByteDance", role: "Job search", note: "filter to Singapore + Engineering", type: "page", url: "https://joinbytedance.com/search", linkLabel: "joinbytedance.com" },
      { company: "PropertyGuru", role: "Software Engineer", note: "GenAI-specialized track seen open", type: "direct", url: "https://squarepeg.getro.com/companies/propertyguru-singapore/jobs/43360977-software-engineer", linkLabel: "squarepeg.getro.com" },
      { company: "Carousell", role: "All openings", note: "\"Barrels\" grad cohort runs ~Jul 2026", type: "page", url: "https://careers.carousell.com/openings/", linkLabel: "careers.carousell.com" },
      { company: "Ninja Van", role: "Careers", note: "explicitly fresh-grad friendly", type: "page", url: "https://www.ninjavan.co/en-sg/company/careers", linkLabel: "ninjavan.co" },
      { company: "PayPal", role: "University Hiring — Asia-Pacific", type: "program", url: "https://careers.pypl.com/university-hiring/asia-pacific/", linkLabel: "careers.pypl.com" },
      { company: "Meta", role: "Software Engineer (University Graduate), Singapore", type: "direct", url: "https://www.metacareers.com/v2/jobs/551261284096703/", linkLabel: "metacareers.com" },
      { company: "Visa", role: "Students & Early Careers", type: "program", url: "https://corporate.visa.com/en/careers/early-careers.html", linkLabel: "corporate.visa.com" },
    ],
  },
  {
    country: "United Kingdom",
    blurb: "Sponsorship-confirmed employers only. Still verify on the specific req — policy can vary by team even within a sponsoring company.",
    listings: [
      { company: "Revolut", role: "Graduate Programme 2027 — Software Engineer (Python)", note: "visa + relocation support stated", type: "direct", url: "https://www.revolut.com/careers/position/graduate-programme-2027-software-engineer-python-f3f6861d-2013-4a52-b95f-15e44a73625f/", linkLabel: "revolut.com" },
      { company: "Palantir", role: "Forward Deployed Software Engineer, New Grad", note: "UK Government team", type: "direct", url: "https://jobs.lever.co/palantir/b4aa51a2-bc43-4d67-bf55-12db7feefb3a", linkLabel: "jobs.lever.co" },
      { company: "Palantir", role: "Students & Early Talent hub", type: "page", url: "https://www.palantir.com/careers/students-and-early-talent/", linkLabel: "palantir.com" },
      { company: "Bloomberg", role: "Graduate Program — UK", type: "program", url: "https://uk.prosple.com/graduate-employers/bloomberg-uk/jobs-internships/graduate-program", linkLabel: "prosple.com" },
      { company: "Wise", role: "Graduate Software Engineer, London", type: "direct", url: "https://wise.jobs/job/graduate-software-engineer-in-london-jid-785", linkLabel: "wise.jobs" },
      { company: "Wise", role: "Early Careers hub", type: "page", url: "https://wise.jobs/early-careers", linkLabel: "wise.jobs" },
      { company: "Arm", role: "Graduate Software Engineer, Cambridge", type: "direct", url: "https://careers.arm.com/job/cambridge/graduate-software-engineer/33099/88115661088", linkLabel: "careers.arm.com" },
      { company: "Arm", role: "Graduate Program hub", type: "program", url: "https://careers.arm.com/graduates", linkLabel: "careers.arm.com" },
      { company: "Jane Street", role: "Software Engineer, London", note: "sponsors virtually all hires", type: "direct", url: "https://www.janestreet.com/join-jane-street/position/4274814002/", linkLabel: "janestreet.com" },
      { company: "Jane Street", role: "All open roles", type: "page", url: "https://www.janestreet.com/join-jane-street/open-roles/", linkLabel: "janestreet.com" },
      { company: "Darktrace", role: "Careers", note: "cybersecurity AI, Cambridge-founded", type: "page", url: "https://www.darktrace.com/careers", linkLabel: "darktrace.com" },
      { company: "Checkout.com", role: "Careers", type: "page", url: "https://www.checkout.com/careers", linkLabel: "checkout.com" },
      { company: "Ocado Technology", role: "Software Engineering Graduate Programme", note: "confirm current cohort year", type: "program", url: "https://www.brightnetwork.co.uk/graduate-jobs/ocado/software-engineering-graduate-2025", linkLabel: "brightnetwork.co.uk" },
      { company: "Monzo", role: "Careers", note: "no formal grad scheme — rolling reqs", type: "page", url: "https://monzo.com/careers", linkLabel: "monzo.com" },
      { company: "Google", role: "Software Engineer, University Graduate, 2026", note: "London-eligible cohort", type: "direct", url: "https://www.google.com/about/careers/applications/jobs/results/112954792476582598-software-engineer-university-graduate-2026", linkLabel: "google.com/careers" },
      { company: "Databricks", role: "Open positions", note: "UK — AI/Forward Deployed Engineer roles seen open", type: "page", url: "https://www.databricks.com/company/careers/open-positions", linkLabel: "databricks.com" },
    ],
  },
];
