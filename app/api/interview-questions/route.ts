import { NextRequest, NextResponse } from "next/server";
import { InterviewPrepRequestSchema } from "@/lib/types";
import { generateInterviewQuestions, TailoringError } from "@/lib/claude";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const parsed = InterviewPrepRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request. Please provide a valid profile and job description." },
      { status: 400 }
    );
  }

  try {
    const { interviewPrep, usage } = await generateInterviewQuestions(
      parsed.data.profile,
      parsed.data.jobDescription,
      parsed.data.resume
    );
    return NextResponse.json({ ...interviewPrep, _usage: usage });
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
