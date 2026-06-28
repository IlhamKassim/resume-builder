import type { ProfileData } from "@/lib/types";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (values[i] ?? "").trim()]));
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

interface CSVFiles {
  profile?: string;
  positions?: string;
  education?: string;
  skills?: string;
}

export function parseLinkedInCSV(files: CSVFiles): ProfileData {
  // Profile.csv — name, headline, summary, location
  const profileRows = files.profile ? parseCSV(files.profile) : [];
  const p = profileRows[0] ?? {};

  const firstName = p["First Name"] ?? "";
  const lastName = p["Last Name"] ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ");
  const headline = p["Headline"] ?? "";
  const summary = p["Summary"] ?? "";
  const location = p["Geo Location"] ?? p["Zip Code"] ?? "";
  const website = extractWebsite(p["Websites"] ?? "");

  // Positions.csv — work experience
  const positionRows = files.positions ? parseCSV(files.positions) : [];
  const experience: ProfileData["experience"] = positionRows
    .filter((r) => r["Company Name"] || r["Title"])
    .map((r) => ({
      company: r["Company Name"] ?? "",
      title: r["Title"] ?? "",
      startDate: formatLinkedInDate(r["Started On"] ?? ""),
      endDate: r["Finished On"] ? formatLinkedInDate(r["Finished On"]) : null,
      location: r["Location"] || undefined,
      bullets: r["Description"] ? splitBullets(r["Description"]) : [],
    }));

  // Education.csv
  const educationRows = files.education ? parseCSV(files.education) : [];
  const education: ProfileData["education"] = educationRows
    .filter((r) => r["School Name"])
    .map((r) => ({
      school: r["School Name"] ?? "",
      degree: r["Degree Name"] ?? "Degree",
      field: r["Notes"] ?? r["Activities"] ?? "",
      startDate: formatLinkedInDate(r["Start Date"] ?? ""),
      endDate: formatLinkedInDate(r["End Date"] ?? ""),
    }));

  // Skills.csv
  const skillRows = files.skills ? parseCSV(files.skills) : [];
  const skills = skillRows.map((r) => r["Name"]).filter(Boolean);

  return {
    name: name || "Unknown",
    headline,
    location,
    summary,
    experience: experience.length > 0 ? experience : [{
      company: "See LinkedIn",
      title: "Add your experience",
      startDate: "",
      endDate: null,
      bullets: [],
    }],
    education,
    skills,
    projects: [],
    contact: {
      website: website || undefined,
      linkedin: `https://www.linkedin.com/in/`,
    },
  };
}

function extractWebsite(raw: string): string {
  const match = raw.match(/\[(?:PERSONAL|COMPANY|PORTFOLIO|OTHER):([^\]]+)\]/);
  return match?.[1] ?? raw;
}

function formatLinkedInDate(raw: string): string {
  // LinkedIn exports dates as "Jan 2022" or "2022-01" — normalise to "2022-01"
  if (!raw) return "";
  const monthMap: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const match = raw.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (match) return `${match[2]}-${monthMap[match[1]] ?? "01"}`;
  if (/^\d{4}$/.test(raw)) return raw;
  return raw;
}

function splitBullets(text: string): string[] {
  return text
    .split(/\n|•|–|-(?=\s)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}
