export const DAY_LABELS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"] as const;

export const MONTH_LABELS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
] as const;

export type ViewMonth = { year: number; month: number };

export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startOffset = (first.getDay() + 6) % 7;
  const cells: Array<{ day: number; iso: string } | null> = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= lastDay; day++) {
    cells.push({ day, iso: isoDate(year, month, day) });
  }
  return cells;
}

export function shiftViewMonth(view: ViewMonth, delta: number): ViewMonth {
  const d = new Date(view.year, view.month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function viewMonthFromIso(iso: string): ViewMonth {
  const [y, m] = iso.split("-").map(Number);
  return { year: y, month: m - 1 };
}

export function formatMesicLabel(mesic: string): string {
  if (/^\d{4}$/.test(mesic)) return `Celý rok ${mesic}`;
  const [rokStr, mesicStr] = mesic.split("-");
  const idx = Number(mesicStr) - 1;
  if (idx >= 0 && idx < 12) return `${MONTH_LABELS[idx]} ${rokStr}`;
  return mesic;
}
