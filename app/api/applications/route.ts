import { NextRequest, NextResponse } from "next/server";
import { ApplicationCreateSchema } from "@/lib/applications";
import { createApplication, listApplications } from "@/lib/applications-store";

export async function GET() {
  return NextResponse.json(await listApplications());
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const parsed = ApplicationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid application data." }, { status: 400 });
  }

  return NextResponse.json(await createApplication(parsed.data), { status: 201 });
}
