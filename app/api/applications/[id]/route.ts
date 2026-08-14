import { NextRequest, NextResponse } from "next/server";
import { ApplicationUpdateSchema } from "@/lib/applications";
import {
  deleteApplication,
  getApplication,
  updateApplication,
} from "@/lib/applications-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const app = await getApplication(id);
  if (!app) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }
  return NextResponse.json(app);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const parsed = ApplicationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid application data." }, { status: 400 });
  }

  const updated = await updateApplication(id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteApplication(id);
  if (!deleted) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
