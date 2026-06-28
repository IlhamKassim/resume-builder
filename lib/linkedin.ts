import { load, type CheerioAPI } from "cheerio";
import type { ProfileData } from "@/lib/types";

export class LinkedInScrapingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LinkedInScrapingError";
  }
}

const LINKEDIN_PROFILE_RE = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9%-]+\/?/;

export function validateLinkedInUrl(url: string): void {
  if (!url || !LINKEDIN_PROFILE_RE.test(url)) {
    throw new LinkedInScrapingError(
      "Please provide a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)"
    );
  }
}

export async function fetchLinkedInProfile(url: string): Promise<ProfileData> {
  validateLinkedInUrl(url);

  let html: string;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });

    if (response.status === 403 || response.status === 429 || response.status === 999) {
      throw new LinkedInScrapingError(
        "LinkedIn is blocking automated access. Please upload your LinkedIn PDF export instead."
      );
    }

    if (!response.ok) {
      throw new LinkedInScrapingError(
        "LinkedIn profile couldn't be fetched. The profile may be private. Please upload your LinkedIn PDF export instead."
      );
    }

    html = await response.text();
  } catch (err) {
    if (err instanceof LinkedInScrapingError) throw err;
    throw new LinkedInScrapingError(
      "Couldn't reach LinkedIn. Please check your connection or upload your LinkedIn PDF export instead."
    );
  }

  return parseLinkedInHtml(html);
}

export function parseLinkedInHtml(html: string): ProfileData {
  const $ = load(html);

  const name = extractName($);
  if (!name) {
    throw new LinkedInScrapingError(
      "Couldn't extract profile data from LinkedIn. The profile may be private or LinkedIn's layout has changed. Please upload your LinkedIn PDF export instead."
    );
  }

  const headline = extractHeadline($);
  const location = extractLocation($);
  const summary = extractSummary($);
  const experience = extractExperience($);
  const education = extractEducation($);
  const skills = extractSkills($);
  const contact = extractContact($);

  return {
    name,
    headline: headline ?? "",
    location: location ?? "",
    summary: summary ?? "",
    experience: experience.length > 0 ? experience : [
      { company: "See LinkedIn", title: "See LinkedIn", startDate: "", endDate: null, bullets: [] },
    ],
    education,
    skills,
    projects: [],
    contact,
  };
}

function extractName($: CheerioAPI): string {
  return (
    $(".top-card-layout__title").first().text().trim() ||
    $("h1.text-heading-xlarge").first().text().trim() ||
    $("h1").first().text().trim() ||
    extractFromJsonLd($, "name")
  );
}

function extractHeadline($: CheerioAPI): string {
  return (
    $(".top-card-layout__headline").first().text().trim() ||
    $(".text-body-medium.break-words").first().text().trim() ||
    extractFromJsonLd($, "jobTitle")
  );
}

function extractLocation($: CheerioAPI): string {
  return (
    $(".top-card-layout__first-subline").first().text().trim() ||
    $(".text-body-small.inline.t-black--light.break-words").first().text().trim()
  );
}

function extractSummary($: CheerioAPI): string {
  return (
    $('[data-section="summary"] .summary').text().trim() ||
    $('[data-section="summary"]').find("p, div").first().text().trim() ||
    $(".summary").text().trim()
  );
}

function extractExperience($: CheerioAPI) {
  const items: ProfileData["experience"] = [];

  $('[data-section="experience"] .experience-item, .experience__list-item').each((_, el) => {
    const title =
      $(el).find(".experience-item__title, h3").first().text().trim();
    const company =
      $(el).find(".experience-item__subtitle, .experience-item__company-name, p").first().text().trim();
    const times = $(el).find("time");
    const startDate = times.eq(0).text().trim();
    const endDateRaw = times.eq(1).text().trim().toLowerCase();
    const endDate = !endDateRaw || endDateRaw === "present" ? null : endDateRaw;
    const location = $(el).find(".experience-item__location").text().trim() || undefined;

    const descriptionText = $(el)
      .find(".experience-item__description, .experience-item__description-container")
      .text()
      .trim();

    const bullets = descriptionText
      ? descriptionText
          .split(/\n|\.(?=\s)/)
          .map((s) => s.trim())
          .filter((s) => s.length > 10)
      : [];

    if (title && company) {
      items.push({ title, company, startDate, endDate, bullets, location });
    }
  });

  return items;
}

function extractEducation($: CheerioAPI): ProfileData["education"] {
  const items: ProfileData["education"] = [];

  $('[data-section="education"] .education__list-item, .education__list-item').each((_, el) => {
    const school = $(el).find(".education__school-name, h3").first().text().trim();
    const degreeInfo = $(el).find(".education__item-degree-info, .education__item--details").first().text().trim();
    const times = $(el).find("time");
    const startDate = times.eq(0).text().trim();
    const endDate = times.eq(1).text().trim();

    // Parse "Bachelor of Science, Computer Science" → degree + field
    const [degreePart, fieldPart] = degreeInfo.split(",").map((s) => s.trim());

    if (school) {
      items.push({
        school,
        degree: degreePart || "Degree",
        field: fieldPart || "",
        startDate: startDate || "",
        endDate: endDate || "",
      });
    }
  });

  return items;
}

function extractSkills($: CheerioAPI): string[] {
  const skills: string[] = [];

  $('[data-section="skills"] .skill-category__skill span, .skill-category__skill span').each(
    (_, el) => {
      const skill = $(el).text().trim();
      if (skill) skills.push(skill);
    }
  );

  return skills;
}

function extractContact($: CheerioAPI): ProfileData["contact"] {
  const linkedinUrl =
    $('link[rel="canonical"]').attr("href") ||
    $('meta[property="og:url"]').attr("content") ||
    undefined;

  return {
    linkedin: linkedinUrl?.startsWith("https://www.linkedin.com/in/")
      ? linkedinUrl
      : undefined,
  };
}

function extractFromJsonLd($: CheerioAPI, key: string): string {
  const script = $('script[type="application/ld+json"]').first().html();
  if (!script) return "";
  try {
    const data = JSON.parse(script) as Record<string, unknown>;
    const value = data[key];
    if (typeof value === "string") return value;
    if (key === "name" && data["@type"] === "Person" && typeof data["name"] === "string") {
      return data["name"];
    }
  } catch {
    // ignore
  }
  return "";
}
