import { NextRequest, NextResponse } from "next/server";
import { parseLinkedInCSV } from "@/lib/linkedin-csv";
import { ProfileDataSchema } from "@/lib/types";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
  }

  const csvMap: { profile?: string; positions?: string; education?: string; skills?: string } = {};

  for (const file of files) {
    const text = await file.text();
    const name = file.name.toLowerCase();
    if (name.includes("profile")) csvMap.profile = text;
    else if (name.includes("position")) csvMap.positions = text;
    else if (name.includes("education")) csvMap.education = text;
    else if (name.includes("skill")) csvMap.skills = text;
  }

  if (!csvMap.profile) {
    return NextResponse.json(
      { error: "Profile.csv is required. Please include it in your upload." },
      { status: 400 }
    );
  }

  try {
    const profile = parseLinkedInCSV(csvMap);
    const validated = ProfileDataSchema.safeParse(profile);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Could not parse profile data from the CSV files. Please check the files and try again." },
        { status: 422 }
      );
    }
    return NextResponse.json(validated.data);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse CSV files. Please ensure you uploaded the correct LinkedIn export files." },
      { status: 500 }
    );
  }
}
