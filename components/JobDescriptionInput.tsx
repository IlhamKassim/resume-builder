"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  onGenerate: (jobDescription: string) => void;
  isGenerating: boolean;
}

export function JobDescriptionInput({ onGenerate, isGenerating }: Props) {
  const [jobDescription, setJobDescription] = useState("");

  return (
    <div className="space-y-3 mt-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Description
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Paste the full job posting. The more detail, the better the tailoring.
        </p>
        <Textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="We are looking for a Software Engineer…"
          rows={10}
          className="resize-none text-sm"
        />
      </div>

      <Button
        onClick={() => onGenerate(jobDescription)}
        disabled={!jobDescription.trim() || isGenerating}
        className="w-full"
      >
        {isGenerating ? "Generating your resume…" : "Generate Resume"}
      </Button>

      {isGenerating && (
        <p className="text-xs text-center text-gray-400">
          This takes about 10–15 seconds
        </p>
      )}
    </div>
  );
}
