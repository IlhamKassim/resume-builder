import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ResumeData } from "@/lib/types";

// Register Helvetica (built-in, no external fetch needed — ATS safe)
Font.registerHyphenationCallback((word) => [word]);

const COLORS = {
  black: "#111111",
  dark: "#333333",
  mid: "#555555",
  light: "#777777",
  rule: "#cccccc",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.dark,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 48,
    lineHeight: 1.4,
  },
  // Contact header
  header: { marginBottom: 12 },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", color: COLORS.black, marginBottom: 4 },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  contactItem: { fontSize: 9, color: COLORS.mid },
  contactSep: { fontSize: 9, color: COLORS.light },
  // Section
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.black,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 0.75,
    borderBottomColor: COLORS.rule,
    paddingBottom: 2,
    marginBottom: 6,
  },
  // Experience / Project entry
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, color: COLORS.black },
  entryDate: { fontSize: 9, color: COLORS.light },
  entrySubtitle: { fontSize: 9.5, color: COLORS.mid, marginBottom: 3 },
  bullet: { flexDirection: "row", marginBottom: 1.5, paddingLeft: 8 },
  bulletDot: { width: 8, fontSize: 10, color: COLORS.mid },
  bulletText: { flex: 1, fontSize: 9.5, color: COLORS.dark },
  // Skills
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  skill: { fontSize: 9.5, color: COLORS.dark },
  skillSep: { fontSize: 9.5, color: COLORS.light },
  // Summary
  summaryText: { fontSize: 9.5, color: COLORS.dark, lineHeight: 1.5 },
});

function formatDate(date: string | null): string {
  if (!date) return "Present";
  // Handle "2023-09" → "Sep 2023"
  const [year, month] = date.split("-");
  if (!month) return year;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function ContactSection({ contact }: { contact: ResumeData["contact"] }) {
  const items = [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedin,
    contact.github,
    contact.website,
  ].filter(Boolean) as string[];

  return (
    <View style={styles.header}>
      <Text style={styles.name}>{contact.name}</Text>
      <View style={styles.contactRow}>
        {items.map((item, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 6 }}>
            {i > 0 && <Text style={styles.contactSep}>·</Text>}
            <Text style={styles.contactItem}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SummarySection({ summary }: { summary: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Summary</Text>
      <Text style={styles.summaryText}>{summary}</Text>
    </View>
  );
}

function ExperienceSection({ experience }: { experience: ResumeData["experience"] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Experience</Text>
      {experience.map((job, i) => (
        <View key={i} style={{ marginBottom: 8 }}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>{job.title}</Text>
            <Text style={styles.entryDate}>
              {formatDate(job.startDate)} – {formatDate(job.endDate)}
            </Text>
          </View>
          <Text style={styles.entrySubtitle}>
            {job.company}{job.location ? `  ·  ${job.location}` : ""}
          </Text>
          {job.bullets.map((bullet, j) => (
            <View key={j} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
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
        <View key={i} style={{ marginBottom: 4 }}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>{edu.school}</Text>
            <Text style={styles.entryDate}>
              {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
            </Text>
          </View>
          <Text style={styles.entrySubtitle}>
            {edu.degree}{edu.field ? `, ${edu.field}` : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SkillsSection({ skills }: { skills: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Skills</Text>
      <View style={styles.skillsRow}>
        {skills.map((skill, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 5 }}>
            {i > 0 && <Text style={styles.skillSep}>·</Text>}
            <Text style={styles.skill}>{skill}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ProjectsSection({ projects }: { projects: ResumeData["projects"] }) {
  if (!projects.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Projects</Text>
      {projects.map((project, i) => (
        <View key={i} style={{ marginBottom: 5 }}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>{project.name}</Text>
            {project.url && <Text style={styles.entryDate}>{project.url}</Text>}
          </View>
          <Text style={styles.bulletText}>{project.description}</Text>
          {project.technologies && project.technologies.length > 0 && (
            <Text style={styles.entrySubtitle}>
              {project.technologies.join(" · ")}
            </Text>
          )}
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
        {data.experience.length > 0 && <ExperienceSection experience={data.experience} />}
        {data.education.length > 0 && <EducationSection education={data.education} />}
        {data.skills.length > 0 && <SkillsSection skills={data.skills} />}
        {data.projects.length > 0 && <ProjectsSection projects={data.projects} />}
      </Page>
    </Document>
  );
}
