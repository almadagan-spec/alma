import type { SummaryStatus } from "@/lib/types";

const LABEL: Record<SummaryStatus, string> = { none: "אין", draft: "טיוטה", signed: "חתום" };
const STYLE: Record<SummaryStatus, string> = {
  none: "bg-box text-muted border-line",
  draft: "bg-amber-50 text-amber-800 border-amber-300",
  signed: "bg-emerald-50 text-emerald-800 border-emerald-300",
};

export function StatusBadge({ status }: { status: SummaryStatus }) {
  return <span className={`inline-block rounded border px-2 py-0.5 text-xs ${STYLE[status]}`}>{LABEL[status]}</span>;
}
