import { NextResponse } from "next/server";
import { generateJobDossier, TailoringError } from "@/lib/claude";
import { writeDossier } from "@/lib/job-dossier-store";
import { listApplications } from "@/lib/applications-store";
import type { JobDossier } from "@/lib/job-listings";

export async function POST() {
  try {
    const applications = await listApplications();
    // Dedup, case-insensitive — "already on the candidate's active application list" per the
    // dossier blurbs, regardless of status (saved/applied/rejected/etc. all still count as
    // already-tracked, so none should be re-suggested).
    const excludeCompanies = [...new Set(applications.map((a) => a.company))];

    const { countries, usage } = await generateJobDossier(excludeCompanies);

    const dossier: JobDossier = {
      compiledOn: new Date().toISOString().slice(0, 10),
      countries,
    };
    await writeDossier(dossier);

    return NextResponse.json({ ...dossier, _usage: usage });
  } catch (err) {
    if (err instanceof TailoringError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: "An unexpected error occurred while refreshing the dossier. Please try again." },
      { status: 500 }
    );
  }
}
