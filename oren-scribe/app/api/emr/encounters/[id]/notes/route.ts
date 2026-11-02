// Fake Oren EMR: POST /encounters/{encounter_id}/notes

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getEncounter } from "@/lib/emr/data";
import { emrError, isAuthorized, validateNoteInput } from "@/lib/emr/api";
import {
  addEmrNote,
  getSimulatedError,
  setEncounterStatus,
  setSimulatedError,
} from "@/lib/store";
import type { EmrNote, NoteInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Dev panel: an error the demo asked to simulate on the next send (one-time).
  const simulated = await getSimulatedError();
  if (simulated) {
    await setSimulatedError(null);
    if (simulated === 401) return emrError(401, "Access token expired");
    if (simulated === 409) return emrError(409, "Encounter is already closed");
    return emrError(503, "EMR is temporarily unavailable");
  }

  if (!isAuthorized(req)) return emrError(401, "Access token is missing or expired");

  const { id } = await params;
  const encounter = await getEncounter(id);
  if (!encounter) return emrError(404, `Encounter ${id} not found`);
  if (encounter.status === "closed") return emrError(409, "Encounter is already closed");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return emrError(422, "Body is not valid JSON");
  }

  const errors = validateNoteInput(body, encounter.physician.id);
  if (errors.length) return emrError(422, "Validation failed", errors);

  const input = body as NoteInput;
  const note: EmrNote = {
    note_id: `NOTE-${randomUUID().slice(0, 8)}`,
    encounter_id: id,
    author_id: input.author_id,
    status: input.status,
    sections: input.sections.map((s) => ({ code: s.code, text: s.text })),
    created_at: new Date().toISOString(),
  };
  await addEmrNote(note);

  // A signed note completes the visit: the encounter closes, so a second
  // signed POST gets 409 (corrections would be an addendum, out of scope).
  if (note.status === "signed") await setEncounterStatus(id, "closed");

  return NextResponse.json(note, { status: 201 });
}
