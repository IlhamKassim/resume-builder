"use client";

import { forwardRef } from "react";
import type { CoverLetterData, Contact } from "@/lib/types";
import { editableProps } from "@/components/editable";

type FieldPath = (string | number)[];

interface Props {
  data: CoverLetterData;
  contact: Contact & { name: string };
  onEdit?: (path: FieldPath, value: string) => void;
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export const CoverLetterPreview = forwardRef<HTMLDivElement, Props>(function CoverLetterPreview(
  { data, contact, onEdit },
  ref
) {
  const contactLine = [contact.email, contact.phone, contact.location].filter(Boolean).join("  ·  ");

  // `className` MUST be passed here (not as a separate JSX attribute) — editableProps
  // returns its own className, and a sibling className attribute would be silently
  // overwritten by whichever one appears later in the spread, not merged with it.
  function edit(path: FieldPath, value: string, className: string, opts?: { multiline?: boolean }) {
    if (!onEdit) return { className };
    return editableProps(value, (v) => onEdit(path, v), { ...opts, className });
  }

  return (
    // Mirrors ResumePreview's page geometry so both print identically.
    <div ref={ref} className="bg-white text-[#1a1a1a] px-[54px] py-[36px] max-w-[794px] mx-auto shadow-sm border border-gray-100 font-sans text-[10pt] leading-[1.4] print:shadow-none print:border-none print:max-w-none print:mx-0">
      <div className="mb-[18px]">
        <h1 className="text-[14pt] font-bold text-center text-[#111111] mb-[3px] leading-tight">
          {contact.name}
        </h1>
        {contactLine && (
          <p className="text-[9.5pt] text-[#333333] text-center">{contactLine}</p>
        )}
      </div>

      <p className="text-[10pt] mb-[16px]">{todayFormatted()}</p>

      <p {...edit(["greeting"], data.greeting, "text-[10pt] mb-[12px]")}>
        {data.greeting}
      </p>

      {data.paragraphs.map((paragraph, i) => (
        <p
          key={i}
          {...edit(["paragraphs", i], paragraph, "text-[10pt] mb-[12px] leading-[1.4]", { multiline: true })}
        >
          {paragraph}
        </p>
      ))}

      <p {...edit(["signOff"], data.signOff, "text-[10pt] mb-[2px]")}>
        {data.signOff}
      </p>
      <p className="text-[10pt] font-bold">{contact.name}</p>
    </div>
  );
});
