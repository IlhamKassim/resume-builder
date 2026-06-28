import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchLinkedInProfile, LinkedInScrapingError } from "@/lib/linkedin";

const RequestSchema = z.object({
  url: z.string().url(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a valid LinkedIn profile URL." },
      { status: 400 }
    );
  }

  try {
    const profile = await fetchLinkedInProfile(parsed.data.url);
    return NextResponse.json(profile);
  } catch (err) {
    if (err instanceof LinkedInScrapingError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
