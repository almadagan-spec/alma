// Fake EMR – home screen (schedule).

import { listEncounters } from "@/lib/emr/data";
import { getEmrNotes, hasDraft } from "@/lib/store";
import { formatTime } from "@/lib/format";
import { patientName, physicianName } from "@/lib/demo/patients";
import { ScheduleTabs, type ScheduleRow } from "@/components/ScheduleTabs";
import type { SummaryStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// Grey, non-clickable placeholder slots around the three real visits.
const PLACEHOLDER_TIMES = ["08:00", "08:40", "11:20", "12:00", "12:40", "13:20", "14:00", "14:40", "15:20", "16:00"];

export default async function Home() {
  const encounters = await listEncounters();

  const real: ScheduleRow[] = await Promise.all(
    encounters.map(async (e) => {
      const notes = await getEmrNotes(e.encounter_id);
      const status: SummaryStatus = notes.some((n) => n.status === "signed")
        ? "signed"
        : (await hasDraft(e.encounter_id))
          ? "draft"
          : "none";
      return {
        time: formatTime(e.started_at),
        patient: patientName(e.encounter_id),
        physician: physicianName(e.physician.id, e.physician.name),
        status,
        encounterId: e.encounter_id,
      };
    }),
  );

  const placeholders: ScheduleRow[] = PLACEHOLDER_TIMES.map((time) => ({
    time,
    patient: "ישראל לוי",
    physician: 'ד"ר מיכל אביב',
    status: null,
    encounterId: null,
  }));

  const rows = [...real, ...placeholders].sort((a, b) => a.time.localeCompare(b.time));
  return <ScheduleTabs rows={rows} />;
}
