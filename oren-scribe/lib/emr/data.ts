// The fake EMR's "database": encounters.json as provided in the assignment.
// Encounter status can change at runtime (a signed note closes the encounter),
// so the live status is read from the store and layered on top.

import encountersFile from "@/data/encounters.json";
import type { Encounter, EncounterStatus } from "@/lib/types";
import { getEncounterStatusOverride } from "@/lib/store";

const BASE_ENCOUNTERS = encountersFile.encounters as Encounter[];

export function listEncounterIds(): string[] {
  return BASE_ENCOUNTERS.map((e) => e.encounter_id);
}

export async function getEncounter(id: string): Promise<Encounter | null> {
  const base = BASE_ENCOUNTERS.find((e) => e.encounter_id === id);
  if (!base) return null;
  const override: EncounterStatus | null = await getEncounterStatusOverride(id);
  // structuredClone so callers can never mutate the source data.
  return { ...structuredClone(base), status: override ?? base.status };
}

export async function listEncounters(): Promise<Encounter[]> {
  const all = await Promise.all(listEncounterIds().map((id) => getEncounter(id)));
  return all.filter((e): e is Encounter => e !== null);
}
