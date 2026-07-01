import { forwardRef } from "react";
import type { ResumeData } from "@/lib/types";

interface Props {
  data: ResumeData;
}

function formatDate(date: string | null | undefined): string {
  if (date === null || date === undefined) return "Present";
  if (!date) return "";
  const [year, month] = date.split("-");
  if (!month) return year;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function dateRange(start: string, end: string | null): string {
  const s = formatDate(start);
  const e = formatDate(end);
  if (!s && !e) return "";
  if (!s) return e;
  return `${s} – ${e}`;
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "");
}

function BoldLabelText({ text }: { text: string }) {
  const colonIdx = text.indexOf(": ");
  if (colonIdx === -1) return <span>{text}</span>;
  return (
    <span>
      <strong>{text.slice(0, colonIdx + 1)}</strong>
      {text.slice(colonIdx + 1)}
    </span>
  );
}

export const ResumePreview = forwardRef<HTMLDivElement, Props>(function ResumePreview({ data }, ref) {
  const left   = data.contact.email ?? "";
  const center = data.contact.phone ?? "";
  const right  = data.contact.linkedin
    ? displayUrl(data.contact.linkedin)
    : data.contact.website
      ? displayUrl(data.contact.website)
      : "";
  // Overflow: location and github only — website omitted when LinkedIn is shown
  const extras = [
    data.contact.location,
    data.contact.github,
  ].filter(Boolean) as string[];

  return (
    // Mirrors PDF: 10pt body, 54px H margins, 36px V margins, 1.1 line-height
    <div ref={ref} className="bg-white text-[#1a1a1a] px-[54px] py-[36px] max-w-[794px] mx-auto shadow-sm border border-gray-100 font-sans text-[10pt] leading-[1.1] print:shadow-none print:border-none print:max-w-none print:mx-0">

      {/* Header — name centered 14pt, contact 3-column */}
      <div className="mb-[6px]">
        <h1 className="text-[14pt] font-bold text-center text-[#111111] mb-[3px] leading-tight">
          {data.contact.name}
        </h1>
        <div className="flex justify-between text-[9.5pt] text-[#333333]">
          <span className="flex-1 text-left">{left}</span>
          <span className="flex-1 text-center">{center}</span>
          <span className="flex-1 text-right">{right}</span>
        </div>
        {extras.length > 0 && (
          <p className="text-[9.5pt] text-[#333333] text-center mt-[1px]">
            {extras.join("  ·  ")}
          </p>
        )}
      </div>

      {/* Summary */}
      {data.summary && (
        <Section title="Summary">
          <p className="text-[10pt] leading-[1.3]">{data.summary}</p>
        </Section>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <Section title="Skills">
          {data.skills.map((cat, i) => (
            <div key={i} className={i < data.skills.length - 1 ? "mb-[1px]" : ""}>
              <span className="font-bold">{cat.category}: </span>
              <span>{cat.items.join("  ·  ")}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <Section title="Professional & Leadership Experience">
          {data.experience.map((job, i) => (
            <div key={i} className={i < data.experience.length - 1 ? "mb-[8px]" : ""}>
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-[#111111]">{job.title}</span>
                {job.location && <span className="text-[#333333]">{job.location}</span>}
              </div>
              <div className="flex justify-between items-baseline mb-[2px]">
                <span className="font-bold">{job.company}</span>
                <span className="text-[#333333]">{dateRange(job.startDate, job.endDate)}</span>
              </div>
              <ul>
                {job.bullets.map((bullet, j) => (
                  <li key={j} className="flex gap-[10px] mb-[1.5px]">
                    <span className="text-[#333333] shrink-0">•</span>
                    <span className="leading-[1.2]"><BoldLabelText text={bullet} /></span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <Section title="Education">
          {data.education.map((edu, i) => (
            <div key={i} className={i < data.education.length - 1 ? "mb-[6px]" : ""}>
              <span className="font-bold text-[#111111]">{edu.school}</span>
              <div className="flex justify-between items-baseline mb-[1px]">
                <span className="font-bold">
                  {edu.degree}{edu.field ? `, ${edu.field}` : ""}
                </span>
                <span className="text-[#333333]">{formatDate(edu.endDate)}</span>
              </div>
              {edu.description && (
                <p className="text-[9.5pt] text-[#555555]">{edu.description}</p>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <Section title="Certifications">
          <p className="text-[10pt] leading-[1.3]">
            {data.certifications.join("  ·  ")}
          </p>
        </Section>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <Section title="Commercial & Technical Projects">
          {data.projects.map((project, i) => (
            <div key={i} className={i < data.projects.length - 1 ? "mb-[8px]" : ""}>
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-[#111111]">{project.name}</span>
                {project.url && <span className="text-[9.5pt] text-[#555555]">{project.url}</span>}
              </div>
              {project.role && (
                <p className="text-[10pt] text-[#333333] mb-[2px]">{project.role}</p>
              )}
              {project.bullets && project.bullets.length > 0 ? (
                <ul>
                  {project.bullets.map((bullet, j) => (
                    <li key={j} className="flex gap-[10px] mb-[1.5px]">
                      <span className="text-[#333333] shrink-0">•</span>
                      <span className="leading-[1.2]"><BoldLabelText text={bullet} /></span>
                    </li>
                  ))}
                </ul>
              ) : project.description ? (
                <p className="text-[10pt] leading-[1.3] mt-[1px]">{project.description}</p>
              ) : null}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-[8px]">
      <h2 className="text-[10pt] font-normal text-[#1a1a1a] border-b border-[#111111] pb-[1px] mb-[4px]">
        {title}
      </h2>
      {children}
    </div>
  );
}
