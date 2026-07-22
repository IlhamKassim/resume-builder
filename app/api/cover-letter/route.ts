import { NextRequest, NextResponse } from "next/server";
import { CoverLetterRequestSchema } from "@/lib/types";
import { generateCoverLetter, TailoringError } from "@/lib/claude";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const parsed = CoverLetterRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request. Please provide a valid profile and job description." },
      { status: 400 }
    );
  }

  try {
    const { coverLetter, usage } = await generateCoverLetter(
      parsed.data.profile,
      parsed.data.jobDescription,
      parsed.data.resume
    );
    return NextResponse.json({ ...coverLetter, _usage: usage });
  } catch (err) {
    if (err instanceof TailoringError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
