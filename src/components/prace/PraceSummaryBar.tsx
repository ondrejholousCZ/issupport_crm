import { formatMoney } from "@/lib/format";
import { formatTotalHours } from "@/lib/prace-summary";

export function PraceSummaryBar({
  totalHours,
  totalCastka,
  count,
}: {
  totalHours: number;
  totalCastka: number;
  count: number;
}) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-border bg-gray-50 px-4 py-2.5 text-sm">
      <span className="text-gray-600">
        Záznamů: <strong className="text-foreground">{count}</strong>
      </span>
      <span className="text-gray-600">
        Čas celkem: <strong className="text-foreground">{formatTotalHours(totalHours)}</strong>
      </span>
      <span className="text-gray-600">
        Fakturace celkem: <strong className="text-foreground">{formatMoney(totalCastka)}</strong>
      </span>
    </div>
  );
}
