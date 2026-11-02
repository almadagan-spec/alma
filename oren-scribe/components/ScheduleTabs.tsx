"use client";

import Link from "next/link";
import { useState } from "react";
import { OrenFrame, outlineButton } from "@/components/OrenFrame";
import { StatusBadge } from "@/components/StatusBadge";
import type { SummaryStatus } from "@/lib/types";

export interface ScheduleRow {
  time: string;
  patient: string;
  physician: string;
  /** null for placeholder rows */
  status: SummaryStatus | null;
  encounterId: string | null;
}

type Tab = "schedule" | "tasks";

export function ScheduleTabs({ rows }: { rows: ScheduleRow[] }) {
  const [tab, setTab] = useState<Tab>("schedule");
  const drafts = rows.filter((r) => r.encounterId && r.status === "draft");

  const tabClass = (t: Tab) =>
    `px-4 pt-1.5 pb-1 mt-1.5 rounded-t-md text-sm ${
      tab === t ? "bg-time font-bold" : "bg-bar-top text-ink/70 hover:text-ink"
    }`;

  return (
    <OrenFrame
      subBar={
        <>
          <div className="flex items-end gap-1" role="tablist">
            <button role="tab" aria-selected={tab === "schedule"} className={tabClass("schedule")} onClick={() => setTab("schedule")}>
              לוח זמנים
            </button>
            <button role="tab" aria-selected={tab === "tasks"} className={tabClass("tasks")} onClick={() => setTab("tasks")}>
              משימות לטיפול{drafts.length > 0 && ` (${drafts.length})`}
            </button>
          </div>
          <div className="flex items-center">
            {/* Not active – only there so the EMR feels real. */}
            <button className={`${outlineButton} cursor-not-allowed`} disabled title="לא פעיל בהדגמה">
              הזן שם מטופל בלי תור
            </button>
          </div>
        </>
      }
    >
      {tab === "schedule" ? <ScheduleTable rows={rows} /> : <TasksList drafts={drafts} />}
    </OrenFrame>
  );
}

function ScheduleTable({ rows }: { rows: ScheduleRow[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-line text-right text-xs text-ink/70">
          <th className="w-20 bg-time/70 px-3 py-1.5 font-semibold">שעה</th>
          <th className="px-3 py-1.5 font-semibold">שם מטופל</th>
          <th className="px-3 py-1.5 font-semibold">רופא/ה</th>
          <th className="px-3 py-1.5 font-semibold">סטטוס סיכום</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) =>
          r.encounterId ? (
            <tr key={i} className="border-b border-line hover:bg-box">
              <td className="bg-time px-3 py-0 font-bold">
                <Link href={`/patient/${r.encounterId}`} className="block py-2">{r.time}</Link>
              </td>
              <td className="px-3 py-0">
                <Link href={`/patient/${r.encounterId}`} className="block py-2 font-medium underline-offset-2 hover:underline">
                  {r.patient}
                </Link>
              </td>
              <td className="px-3 py-2">{r.physician}</td>
              <td className="px-3 py-2">{r.status && <StatusBadge status={r.status} />}</td>
            </tr>
          ) : (
            <tr key={i} className="border-b border-line text-muted" aria-disabled>
              <td className="bg-time/50 px-3 py-2 font-bold">{r.time}</td>
              <td className="px-3 py-2">{r.patient}</td>
              <td className="px-3 py-2">{r.physician}</td>
              <td className="px-3 py-2" />
            </tr>
          ),
        )}
      </tbody>
    </table>
  );
}

function TasksList({ drafts }: { drafts: ScheduleRow[] }) {
  if (drafts.length === 0) {
    return <p className="p-6 text-sm text-muted">אין טיוטות שממתינות לחתימה.</p>;
  }
  return (
    <ul className="divide-y divide-line text-sm">
      {drafts.map((d) => (
        <li key={d.encounterId}>
          <Link href={`/patient/${d.encounterId}`} className="flex items-center gap-4 px-4 py-3 hover:bg-box">
            <span className="font-bold">{d.time}</span>
            <span className="font-medium">{d.patient}</span>
            <span className="text-ink/70">{d.physician}</span>
            <span className="ms-auto">סיכום ממתין לחתימה</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
