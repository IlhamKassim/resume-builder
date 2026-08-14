import type { ProfileData } from "@/lib/types";

export interface FitAnalysis {
  /** Total number of recognized tech keywords found in the job description. */
  totalKeywords: number;
  /** Keywords from the JD that also appear somewhere in the profile. */
  matchedKeywords: string[];
  /** Keywords from the JD that do NOT appear anywhere in the profile. */
  missingKeywords: string[];
  /** 0–100: percentage of JD keywords the profile covers. */
  coverage: number;
  /** Missing keywords surfaced as skills worth verifying/adding to the profile. */
  recommendedSkills: string[];
}

/**
 * Lowercase and split text into tokens, preserving "skill" punctuation that matters
 * (+ # / - and embedded dots) so terms like "C++", "C#", "CI/CD", "node.js" and
 * "full-stack" survive as single tokens while sentence punctuation is dropped.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w+#./-]+/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[^\w+#]+|[^\w+#]+$/g, ""))
    .filter((t) => t.length > 0);
}

/** Normalize a keyword the same way corpus text is tokenized, so matching is consistent. */
function normalizeKeyword(keyword: string): string {
  return tokenize(keyword).join(" ");
}

/** Space-delimited token stream with padded edges so whole-token `includes` works. */
function corpusOf(text: string): string {
  return ` ${tokenize(text).join(" ")} `;
}

/**
 * Recognized technical keywords to scan for. Curated rather than inferred from arbitrary
 * n-grams because naive bigrams produce false "missing skill" flags (e.g. "react typescript"
 * is not a skill). Terms are matched as whole tokens, never substrings, so "go" does not
 * match inside "mongodb".
 */
const COMMON_TECH_KEYWORDS: string[] = [
  // Languages & runtimes
  "typescript", "javascript", "python", "java", "go", "rust", "kotlin", "swift", "ruby",
  "php", "scala", "c++", "c#", "bash", "shell",
  // Web frontend
  "react", "vue", "angular", "svelte", "next.js", "nuxt", "gatsby", "redux", "tailwind",
  "bootstrap", "sass", "less", "html", "css", "webpack", "vite", "rollup", "babel",
  "react-native", "flutter", "d3", "three.js", "webgl", "webassembly",
  // Backend & APIs
  "node.js", "express", "nestjs", "fastify", "django", "flask", "fastapi", "rails", "spring",
  "graphql", "rest", "grpc", "websocket", "json", "xml", "yaml", "http", "oauth", "jwt",
  "sso", "api", "sdk", "cli",
  // Data
  "sql", "postgresql", "mysql", "sqlite", "mongodb", "redis", "elasticsearch", "dynamodb",
  "cassandra", "neo4j", "prisma", "sequelize", "typeorm", "drizzle", "nosql",
  "pandas", "numpy", "scipy", "tensorflow", "pytorch", "keras", "opencv", "spark", "hadoop",
  "airflow", "dbt", "kafka", "rabbitmq", "celery", "etl", "tableau", "powerbi",
  // Cloud & infra
  "aws", "gcp", "azure", "firebase", "vercel", "netlify", "heroku", "docker", "kubernetes",
  "helm", "terraform", "ansible", "jenkins", "nginx", "apache", "linux", "unix", "git",
  "github", "gitlab", "ci/cd", "serverless", "microservices",
  // Testing & process
  "jest", "mocha", "chai", "vitest", "cypress", "playwright", "selenium", "eslint",
  "prettier", "agile", "scrum", "kanban", "jira", "confluence", "tdd", "ddd", "oop",
  // AI / ML
  "ml", "ai", "nlp", "llm", "openai", "langchain",
  // Multi-word concepts
  "machine learning", "deep learning", "data science", "data engineering", "data analysis",
  "data structures", "algorithms", "system design", "distributed systems", "operating systems",
  "computer networks", "object-oriented programming", "functional programming",
  "unit testing", "integration testing", "end-to-end testing", "test-driven development",
  "continuous integration", "continuous deployment", "version control", "code review",
  "pair programming", "agile methodologies", "full-stack", "front-end", "back-end",
  "cloud computing", "cloud infrastructure", "infrastructure as code",
  "service-oriented architecture", "event-driven architecture", "design patterns",
  "clean code", "domain-driven design", "refactoring", "performance optimization",
  "load balancing", "fault tolerance", "high availability", "scalability", "authentication",
  "authorization", "encryption", "data modeling", "data warehousing", "data pipeline",
  "api design", "api development", "rest api", "responsive design", "user experience",
  "user interface", "accessibility", "observability", "monitoring", "logging", "tracing",
  "state management", "server-side rendering", "static site generation",
  "progressive web app", "cross-platform", "mobile development", "backend development",
  "frontend development", "database design", "database administration", "query optimization",
];

const NORMALIZED_KEYWORDS: string[] = COMMON_TECH_KEYWORDS.map(normalizeKeyword);

/** Build the normalized profile text corpus that keywords are matched against. */
function profileCorpus(profile: ProfileData): string {
  return corpusOf(
    [
      profile.headline,
      profile.summary,
      ...profile.skills,
      ...profile.experience.flatMap((e) => [e.company, e.title, ...e.bullets]),
      ...profile.education.flatMap((e) => [e.school, e.degree, e.field]),
      ...profile.projects.flatMap((p) => [
        p.name,
        p.role ?? "",
        p.description ?? "",
        ...(p.bullets ?? []),
        ...(p.technologies ?? []),
      ]),
      ...(profile.certifications ?? []),
    ].join(" \n ")
  );
}

/**
 * Free, deterministic, local-only fit scan: which technical keywords the job description
 * asks for are already covered by the profile, and which are gaps. Mirrors the normalized
 * whole-token corpus technique used by `lib/fidelity-check.ts` — no Claude call, no cost.
 */
export function analyzeFit(profile: ProfileData, jobDescription: string): FitAnalysis {
  const jdCorpus = corpusOf(jobDescription);
  const corpus = profileCorpus(profile);

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const keyword of NORMALIZED_KEYWORDS) {
    if (!jdCorpus.includes(` ${keyword} `)) continue;
    if (corpus.includes(` ${keyword} `)) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  }

  const totalKeywords = matchedKeywords.length + missingKeywords.length;
  const coverage = totalKeywords === 0 ? 0 : Math.round((matchedKeywords.length / totalKeywords) * 100);

  return {
    totalKeywords,
    matchedKeywords,
    missingKeywords,
    coverage,
    recommendedSkills: missingKeywords,
  };
}
