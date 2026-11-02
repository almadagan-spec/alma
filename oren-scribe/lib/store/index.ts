// Data storage behind one small interface.
//
// Today: an in-memory implementation (fine for local dev).
// Before going live we'll pick a persistent backend (e.g. Upstash Redis),
// because on Vercel server memory is not kept between requests.
// Only `createKv()` needs to change for that – the rest of the app
// talks to the functions below.

import type { EmrNote, EncounterStatus } from "@/lib/types";

export interface Kv {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>;
  /** Remove every key that starts with the prefix. */
  clear(prefix: string): Promise<void>;
}

class MemoryKv implements Kv {
  private map = new Map<string, string>();
  async get<T>(key: string) {
    const raw = this.map.get(key);
    return raw === undefined ? null : (JSON.parse(raw) as T);
  }
  async set<T>(key: string, value: T) {
    this.map.set(key, JSON.stringify(value));
  }
  async del(key: string) {
    this.map.delete(key);
  }
  async clear(prefix: string) {
    for (const k of [...this.map.keys()]) if (k.startsWith(prefix)) this.map.delete(k);
  }
}

// Keep one instance across hot reloads in dev.
const g = globalThis as unknown as { __orenKv?: Kv };
function createKv(): Kv {
  return new MemoryKv();
}
export const kv: Kv = (g.__orenKv ??= createKv());

const P = "oren:";

// ---------- EMR side ----------

export async function getEncounterStatusOverride(id: string) {
  return kv.get<EncounterStatus>(`${P}emr:status:${id}`);
}
export async function setEncounterStatus(id: string, status: EncounterStatus) {
  await kv.set(`${P}emr:status:${id}`, status);
}

export async function getEmrNotes(encounterId: string): Promise<EmrNote[]> {
  return (await kv.get<EmrNote[]>(`${P}emr:notes:${encounterId}`)) ?? [];
}
export async function addEmrNote(note: EmrNote) {
  const notes = await getEmrNotes(note.encounter_id);
  await kv.set(`${P}emr:notes:${note.encounter_id}`, [...notes, note]);
}

/** Error to return on the next POST of a note (for the hidden dev panel). */
export type SimulatedError = 401 | 409 | 503;
export async function getSimulatedError() {
  return kv.get<SimulatedError>(`${P}emr:simulate`);
}
export async function setSimulatedError(code: SimulatedError | null) {
  if (code === null) await kv.del(`${P}emr:simulate`);
  else await kv.set(`${P}emr:simulate`, code);
}

// ---------- Scribe side (our product) ----------

/** Whether our product holds an unsigned draft for this encounter. */
export async function hasDraft(encounterId: string): Promise<boolean> {
  return (await kv.get(`${P}scribe:draft:${encounterId}`)) !== null;
}

// ---------- Demo ----------

export async function resetDemo() {
  await kv.clear(P);
}
