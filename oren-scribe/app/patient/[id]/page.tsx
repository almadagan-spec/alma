// Fake EMR – patient screen. Content comes only from the EMR record
// (encounters.json) and from notes written to the EMR. Nothing is invented.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getEncounter } from "@/lib/emr/data";
import { getEmrNotes } from "@/lib/store";
import { formatDate, formatTime } from "@/lib/format";
import { patientName, physicianName, SEX_HE } from "@/lib/demo/patients";
import { OrenFrame, outlineButton } from "@/components/OrenFrame";
import { InfoBox } from "@/components/InfoBox";
import { StatusBadge } from "@/components/StatusBadge";
import { SECTION_LABELS_HE } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enc = await getEncounter(id);
  if (!enc) notFound();
  const notes = (await getEmrNotes(id)).filter((n) => n.status === "signed");

  return (
    <OrenFrame
      subBar={
        <>
          <div className="flex items-baseline gap-3 py-2">
            <h1 className="font-bold">
              {patientName(id)}, {enc.patient.age}, {SEX_HE[enc.patient.sex]}
            </h1>
            <span className="text-xs text-ink/70">
              {formatDate(enc.started_at)} {formatTime(enc.started_at)} · {physicianName(enc.physician.id, enc.physician.name)}
            </span>
          </div>
          <div className="flex items-center">
            <Link href="/" className={outlineButton}>חזרה לדף הראשי</Link>
          </div>
        </>
      }
    >
      <div className="grid flex-1 grid-cols-1 content-start gap-5 p-6 md:grid-cols-2">
        <InfoBox
          title="בדיקות אחרונות"
          items={enc.recent_results.map((r) => `${r.test}: ${r.value}${r.unit === "%" ? "" : " "}${r.unit} (${formatDate(r.date)})`)}
        />
        <InfoBox title="תרופות" items={enc.medications.map((m) => `${m.name} ${m.dose}, ${m.frequency}`)} />
        <InfoBox title="בעיות פעילות" items={enc.active_problems} />
        <InfoBox title="אלרגיות ורגישויות" items={enc.allergies} />
        {/* The EMR record has no vitals or referrals fields. */}
        <InfoBox title="סימנים חיוניים" items={[]} />
        <InfoBox title="הפניות" items={[]} />

        <section className="border border-line bg-box px-5 py-3 md:col-span-2">
          <h2 className="font-bold">סיכומי ביקורים</h2>
          {notes.length === 0 ? (
            <p className="text-sm">אין נתונים</p>
          ) : (
            notes.map((n) => (
              <article key={n.note_id} className="mt-2 border-t border-line pt-2 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium">{formatDate(n.created_at)}</span>
                  <StatusBadge status="signed" />
                </div>
                <ul className="space-y-0.5">
                  {n.sections.map((s) => (
                    <li key={s.code}>
                      <span dir="ltr">{s.code}</span> ({SECTION_LABELS_HE[s.code]}): {s.text}
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </section>
      </div>

      {/* Bottom bar – recording is wired up in stage 2. */}
      <footer className="sticky bottom-0 flex gap-6 border-t border-line bg-white p-6">
        <button className="flex-1 bg-primary py-4 text-2xl font-bold hover:brightness-95">
          התחלת הקלטת ביקור
        </button>
        <button className="w-52 border border-line bg-box py-4 font-bold hover:bg-bar-top">
          כתיבת סיכום ידנית
        </button>
      </footer>
    </OrenFrame>
  );
}
