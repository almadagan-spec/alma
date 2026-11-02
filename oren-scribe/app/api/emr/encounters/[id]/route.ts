// Fake Oren EMR: GET /encounters/{encounter_id}

import { NextResponse } from "next/server";
import { getEncounter } from "@/lib/emr/data";
import { emrError, isAuthorized } from "@/lib/emr/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return emrError(401, "Access token is missing or expired");
  const { id } = await params;
  const encounter = await getEncounter(id);
  if (!encounter) return emrError(404, `Encounter ${id} not found`);
  return NextResponse.json(encounter);
}
