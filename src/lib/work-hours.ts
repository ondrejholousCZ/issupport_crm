/** Efektivní délka práce — 0 h znamená celý pracovní den (8 h). */
export function effectiveWorkHours(hodiny: number, minuty: number): number {
  if (hodiny === 0 && minuty === 0) return 8;
  return hodiny + minuty / 60;
}

/** Excel ukládá čas jako zlomek dne (8 h = 8/24). */
export function toExcelDayFraction(hodiny: number, minuty: number): number {
  return effectiveWorkHours(hodiny, minuty) / 24;
}

export function workerInitials(prijmeni: string, jmeno: string): string {
  const p = prijmeni.trim()[0] ?? "";
  const j = jmeno.trim()[0] ?? "";
  return (p + j).toUpperCase();
}

export function exportCastka(
  hodiny: number,
  minuty: number,
  sazba: string | number | null | undefined,
  stored: string | number | null | undefined,
): number {
  if (hodiny === 0 && minuty === 0 && sazba != null && sazba !== "") {
    return Math.round(effectiveWorkHours(hodiny, minuty) * Number(sazba) * 100) / 100;
  }
  const num = stored === null || stored === undefined || stored === "" ? 0 : Number(stored);
  return Number.isFinite(num) ? num : 0;
}
