import type { ResumeData } from "@/lib/types";

interface Props {
  data: ResumeData;
}

function formatDate(date: string | null): string {
  if (!date) return "Present";
  const [year, month] = date.split("-");
  if (!month) return year;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

export function ResumePreview({ data }: Props) {
  const contactItems = [
    data.contact.email,
    data.contact.phone,
    data.contact.location,
    data.contact.linkedin,
    data.contact.github,
    data.contact.website,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-white text-gray-900 p-10 max-w-[760px] mx-auto shadow-sm border border-gray-100 font-sans text-[13px] leading-relaxed">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{data.contact.name}</h1>
        <p className="text-xs text-gray-500">
          {contactItems.join("  ·  ")}
        </p>
      </div>

      {/* Summary */}
      {data.summary && (
        <Section title="Summary">
          <p className="text-gray-700">{data.summary}</p>
        </Section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <Section title="Experience">
          {data.experience.map((job, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-gray-900">{job.title}</span>
                <span className="text-xs text-gray-400">
                  {formatDate(job.startDate)} – {formatDate(job.endDate)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                {job.company}{job.location ? `  ·  ${job.location}` : ""}
              </p>
              <ul className="space-y-0.5">
                {job.bullets.map((bullet, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span className="text-gray-700">{bullet}</span>
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
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-gray-900">{edu.school}</span>
                <span className="text-xs text-gray-400">
                  {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {edu.degree}{edu.field ? `, ${edu.field}` : ""}
              </p>
            </div>
          ))}
        </Section>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <Section title="Skills">
          <p className="text-gray-700">{data.skills.join("  ·  ")}</p>
        </Section>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <Section title="Projects">
          {data.projects.map((project, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-gray-900">{project.name}</span>
                {project.url && (
                  <span className="text-xs text-gray-400">{project.url}</span>
                )}
              </div>
              <p className="text-gray-700">{project.description}</p>
              {project.technologies && project.technologies.length > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {project.technologies.join(" · ")}
                </p>
              )}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-1 mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}
