// Dates/times are shown in Israel time, regardless of the server's timezone.
const TZ = "Asia/Jerusalem";

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

export function formatDate(isoOrDate: string): string {
  // Plain dates ("2026-04-03") are calendar dates – format without timezone shifts.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoOrDate);
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).formatToParts(new Date(isoOrDate));
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return `${get("day")}.${get("month")}.${get("year")}`;
}
