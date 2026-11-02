// Types that mirror the Oren EMR API (docs/integration_spec.md).

export const SECTION_CODES = [
  "REASON",
  "HISTORY",
  "EXAM",
  "ASSESSMENT",
  "PLAN",
  "MEDICATIONS",
  "FOLLOW_UP",
] as const;

export type SectionCode = (typeof SECTION_CODES)[number];

export const SECTION_LABELS_HE: Record<SectionCode, string> = {
  REASON: "סיבת פנייה",
  HISTORY: "אנמנזה",
  EXAM: "בדיקה",
  ASSESSMENT: "הערכה",
  PLAN: "תוכנית",
  MEDICATIONS: "תרופות",
  FOLLOW_UP: "מעקב",
};

export type EncounterStatus = "open" | "closed";

export interface Encounter {
  encounter_id: string;
  clinic: string;
  physician: { id: string; name: string };
  started_at: string;
  status: EncounterStatus;
  patient: { id: string; age: number; sex: "M" | "F" };
  active_problems: string[];
  medications: { name: string; dose: string; frequency: string }[];
  allergies: string[];
  recent_results: { test: string; value: number; unit: string; date: string }[];
}

export type NoteStatus = "draft" | "signed";

export interface NoteSection {
  code: SectionCode;
  text: string;
}

/** Body of POST /encounters/{id}/notes */
export interface NoteInput {
  author_id: string;
  status: NoteStatus;
  sections: NoteSection[];
}

/** A note as stored in the EMR after a successful POST. */
export interface EmrNote extends NoteInput {
  note_id: string;
  encounter_id: string;
  created_at: string;
}

/** Summary status shown in the schedule (our product's view). */
export type SummaryStatus = "none" | "draft" | "signed";
