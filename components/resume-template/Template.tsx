import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ResumeData } from "@/lib/types";

Font.registerHyphenationCallback((word) => [word]);

const F = {
  roman:   "Helvetica",
  bold:    "Helvetica-Bold",
  italic:  "Helvetica-Oblique",
};

const C = {
  black: "#111111",
  dark:  "#1a1a1a",
  mid:   "#333333",
  light: "#555555",
  rule:  "#aaaaaa",
};

// Matched exactly to Mohammad Ilham bin Kassim Resume.pdf:
// Name ~14pt centered | Contact 3-col (email · phone · linkedin)
// Section titles: regular weight, thin rule below, ~11pt
// Body: 10pt, lineHeight 1.1 (very tight)
// Margins: 54pt H / 36pt V | Entry gap: 8pt | Bullet gap: 1.5pt
const styles = StyleSheet.create({
  page: {
    fontFamily: F.roman,
    fontSize: 10,
    color: C.dark,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 54,
    lineHeight: 1.1,
  },
  // Header — name centered, contact in 3 columns (matching the PDF exactly)
  header: { marginBottom: 6 },
  name: { fontSize: 14, fontFamily: F.bold, color: C.black, textAlign: "center", marginBottom: 3 },
  contactRow: { flexDirection: "row", justifyContent: "space-between" },
  contactLeft:   { fontSize: 9.5, color: C.mid, textAlign: "left",   flex: 1 },
  contactCenter: { fontSize: 9.5, color: C.mid, textAlign: "center", flex: 1 },
  contactRight:  { fontSize: 9.5, color: C.mid, textAlign: "right",  flex: 1 },
  // Section titles — regular weight (not italic/bold), thin rule below
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: F.roman,
    color: C.dark,
    borderBottomWidth: 0.75,
    borderBottomColor: C.black,
    paddingBottom: 1,
    marginBottom: 4,
  },
  // Entry header rows
  entryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  entryTitleBold:   { fontFamily: F.bold, fontSize: 10, color: C.black },
  entryCompanyBold: { fontFamily: F.bold, fontSize: 10, color: C.dark },
  entryMeta:        { fontSize: 10, color: C.mid },
  entryRole:        { fontSize: 10, color: C.mid },
  // Bullets
  bullet:    { flexDirection: "row", marginBottom: 1.5, paddingLeft: 10 },
  bulletDot: { width: 10, fontSize: 10, color: C.mid },
  bulletText:{ flex: 1, fontSize: 10, color: C.dark, lineHeight: 1.2 },
  // Body text (summary, skills description)
  bodyText: { fontSize: 10, color: C.dark, lineHeight: 1.3 },
});

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "");
}

function formatDate(date: string | null | undefined): string {
  if (date === null || date === undefined) return "Present";
  if (!date) return "";
  const [year, month] = date.split("-");
  if (!month) return year;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function DateRange({ start, end }: { start: string; end: string | null }) {
  const s = formatDate(start);
  const e = formatDate(end);
  if (!s && !e) return null;
  if (!s) return <Text style={styles.entryMeta}>{e}</Text>;
  return <Text style={styles.entryMeta}>{s} – {e}</Text>;
}

function Bullet({ text }: { text: string }) {
  const colonIdx = text.indexOf(": ");
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      {colonIdx !== -1 ? (
        <Text style={styles.bulletText}>
          <Text style={{ fontFamily: F.bold }}>{text.slice(0, colonIdx + 1)}</Text>
          <Text>{text.slice(colonIdx + 1)}</Text>
        </Text>
      ) : (
        <Text style={styles.bulletText}>{text}</Text>
      )}
    </View>
  );
}

// 3-column contact row: email (left) | phone (center) | linkedin/website (right)
// Matches the PDF exactly — not a centred single line
function ContactSection({ contact }: { contact: ResumeData["contact"] }) {
  const left   = contact.email ?? "";
  const center = contact.phone ?? "";
  const right  = contact.linkedin
    ? displayUrl(contact.linkedin)
    : contact.website
      ? displayUrl(contact.website)
      : "";

  // Overflow: location and github only — website omitted when LinkedIn is shown
  const extras = [
    contact.location,
    contact.github,
  ].filter(Boolean) as string[];

  return (
    <View style={styles.header}>
      <Text style={styles.name}>{contact.name}</Text>
      <View style={styles.contactRow}>
        <Text style={styles.contactLeft}>{left}</Text>
        <Text style={styles.contactCenter}>{center}</Text>
        <Text style={styles.contactRight}>{right}</Text>
      </View>
      {extras.length > 0 && (
        <Text style={[styles.contactCenter, { textAlign: "center", marginTop: 1 }]}>
          {extras.join("  ·  ")}
        </Text>
      )}
    </View>
  );
}

function SummarySection({ summary }: { summary: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Summary</Text>
      <Text style={styles.bodyText}>{summary}</Text>
    </View>
  );
}

function SkillsSection({ skills }: { skills: ResumeData["skills"] }) {
  if (!skills.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Skills</Text>
      {skills.map((cat, i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: i < skills.length - 1 ? 1 : 0 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 10, color: C.dark }}>{cat.category}: </Text>
          <Text style={{ flex: 1, fontSize: 10, color: C.dark, lineHeight: 1.2 }}>
            {cat.items.join("  ·  ")}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ExperienceSection({ experience }: { experience: ResumeData["experience"] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Professional & Leadership Experience</Text>
      {experience.map((job, i) => (
        <View key={i} style={{ marginBottom: i < experience.length - 1 ? 8 : 0 }} wrap={false}>
          <View style={styles.entryRow}>
            <Text style={styles.entryTitleBold}>{job.title}</Text>
            {job.location && <Text style={styles.entryMeta}>{job.location}</Text>}
          </View>
          <View style={[styles.entryRow, { marginBottom: 2 }]}>
            <Text style={styles.entryCompanyBold}>{job.company}</Text>
            <DateRange start={job.startDate} end={job.endDate} />
          </View>
          {job.bullets.map((bullet, j) => (
            <Bullet key={j} text={bullet} />
          ))}
        </View>
      ))}
    </View>
  );
}

function EducationSection({ education }: { education: ResumeData["education"] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Education</Text>
      {education.map((edu, i) => (
        <View key={i} style={{ marginBottom: i < education.length - 1 ? 6 : 0 }} wrap={false}>
          <View style={styles.entryRow}>
            <Text style={styles.entryTitleBold}>{edu.school}</Text>
          </View>
          <View style={[styles.entryRow, { marginBottom: 1 }]}>
            <Text style={styles.entryCompanyBold}>
              {edu.degree}{edu.field ? `, ${edu.field}` : ""}
            </Text>
            <Text style={styles.entryMeta}>{formatDate(edu.endDate)}</Text>
          </View>
          {edu.description ? (
            <Text style={[styles.bodyText, { fontSize: 9.5, color: C.light }]}>
              {edu.description}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function ProjectsSection({ projects }: { projects: ResumeData["projects"] }) {
  if (!projects.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Commercial & Technical Projects</Text>
      {projects.map((project, i) => (
        <View key={i} style={{ marginBottom: i < projects.length - 1 ? 8 : 0 }} wrap={false}>
          <View style={styles.entryRow}>
            <Text style={styles.entryTitleBold}>{project.name}</Text>
            {project.url && <Text style={styles.entryMeta}>{project.url}</Text>}
          </View>
          {project.role && (
            <Text style={[styles.entryRole, { marginBottom: 2 }]}>{project.role}</Text>
          )}
          {project.bullets && project.bullets.length > 0
            ? project.bullets.map((bullet, j) => <Bullet key={j} text={bullet} />)
            : project.description
              ? <Text style={[styles.bodyText, { marginTop: 1 }]}>{project.description}</Text>
              : null}
        </View>
      ))}
    </View>
  );
}

export function ResumeTemplate({ data }: { data: ResumeData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ContactSection contact={data.contact} />
        {data.summary && <SummarySection summary={data.summary} />}
        {data.skills.length > 0 && <SkillsSection skills={data.skills} />}
        {data.experience.length > 0 && <ExperienceSection experience={data.experience} />}
        {data.education.length > 0 && <EducationSection education={data.education} />}
        {data.projects.length > 0 && <ProjectsSection projects={data.projects} />}
      </Page>
    </Document>
  );
}
