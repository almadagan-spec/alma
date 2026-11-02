// Display names for the demo. The EMR data has no patient names (only IDs),
// so the fake EMR's UI uses these names, chosen for the demo.

export const PATIENT_NAMES: Record<string, string> = {
  "ENC-48213": "יוסי לוי",
  "ENC-48230": "נועה כהן",
  "ENC-48247": "גבי מטה",
};

/** Hebrew display names for physicians (the EMR returns English names). */
export const PHYSICIAN_NAMES_HE: Record<string, string> = {
  "DR-1107": 'ד"ר מיכל אביב',
  "DR-1142": 'ד"ר יעל רונן',
};

export const SEX_HE: Record<"M" | "F", string> = { M: "זכר", F: "נקבה" };

export function patientName(encounterId: string): string {
  return PATIENT_NAMES[encounterId] ?? encounterId;
}

export function physicianName(id: string, fallback: string): string {
  return PHYSICIAN_NAMES_HE[id] ?? fallback;
}
