import { NextRequest, NextResponse } from "next/server";
import { TailorRequestSchema } from "@/lib/types";
import { tailorResume, TailoringError } from "@/lib/claude";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const parsed = TailorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request. Please provide a valid profile and job description." },
      { status: 400 }
    );
  }

  try {
    const { resume, usage, fidelityWarnings } = await tailorResume(
      parsed.data.profile,
      parsed.data.jobDescription
    );
    return NextResponse.json({ ...resume, _usage: usage, _fidelityWarnings: fidelityWarnings });
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
