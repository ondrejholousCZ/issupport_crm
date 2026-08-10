import type { OdvedenaPrace } from "@/lib/types";
import { exportCastka, effectiveWorkHours } from "@/lib/work-hours";

export function summarizePrace(rows: OdvedenaPrace[]) {
  let totalHours = 0;
  let totalCastka = 0;
  for (const row of rows) {
    totalHours += effectiveWorkHours(row.hodiny, row.minuty);
    totalCastka += exportCastka(
      row.hodiny,
      row.minuty,
      row.projekt_sazba_fak,
      row.castka_fakturace,
      row.projekt_jednotka_sazby ?? "hodina",
    );
  }
  return { totalHours, totalCastka };
}

export function formatTotalHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
