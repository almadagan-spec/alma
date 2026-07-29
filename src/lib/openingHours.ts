export interface OpeningTime {
  day: number;
  hours: number;
  minutes: number;
}

export interface OpeningPeriod {
  open: OpeningTime;
  close?: OpeningTime;
}

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

function toMinuteOfWeek(time: OpeningTime): number {
  return time.day * MINUTES_PER_DAY + time.hours * 60 + time.minutes;
}

function parseTimeString(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * True if every period is fully covered by at least one opening period,
 * accounting for periods that wrap past midnight or past the end of the week.
 */
export function isOpenForRange(
  periods: OpeningPeriod[],
  date: Date,
  startTimeStr: string,
  endTimeStr: string,
): boolean {
  const dayIndex = date.getDay();
  const startMinuteOfDay = parseTimeString(startTimeStr);
  const endMinuteOfDay = parseTimeString(endTimeStr);
  const targetStart = dayIndex * MINUTES_PER_DAY + startMinuteOfDay;
  const targetEnd = dayIndex * MINUTES_PER_DAY + endMinuteOfDay;

  return periods.some((period) => {
    const openMinute = toMinuteOfWeek(period.open);
    let closeMinute = period.close
      ? toMinuteOfWeek(period.close)
      : openMinute + MINUTES_PER_WEEK;

    if (closeMinute <= openMinute) closeMinute += MINUTES_PER_WEEK;

    for (const shift of [-MINUTES_PER_WEEK, 0, MINUTES_PER_WEEK]) {
      const shiftedOpen = openMinute + shift;
      const shiftedClose = closeMinute + shift;
      if (shiftedOpen <= targetStart && targetEnd <= shiftedClose) {
        return true;
      }
    }
    return false;
  });
}
