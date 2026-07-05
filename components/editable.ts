import type { FocusEvent, KeyboardEvent } from "react";

const BASE_EDITABLE_CLASSES =
  "outline-none rounded-sm cursor-text hover:bg-amber-50 focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 print:hover:bg-transparent print:focus:ring-0 print:bg-transparent";

/**
 * Props for a contentEditable text node that commits its new value on blur.
 * Used by ResumePreview / CoverLetterPreview so the printed PDF always
 * reflects whatever text is currently in the DOM.
 */
export function editableProps(
  currentValue: string,
  onCommit: (value: string) => void,
  opts: { multiline?: boolean; className?: string } = {}
) {
  return {
    contentEditable: true as const,
    suppressContentEditableWarning: true as const,
    onBlur: (e: FocusEvent<HTMLElement>) => {
      const next = (e.currentTarget.textContent ?? "").trim();
      if (next !== currentValue) onCommit(next);
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" && !opts.multiline) {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    className: `${opts.className ?? ""} ${BASE_EDITABLE_CLASSES}`.trim(),
  };
}

/** Splits a "A · B · C" joined display string back into a clean string array. */
export function splitJoined(text: string): string[] {
  return text
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
}
