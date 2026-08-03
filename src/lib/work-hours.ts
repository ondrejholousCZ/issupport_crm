/** Efektivní délka práce — 0 h znamená celý pracovní den (8 h). */
export const MD_HOURS = 8;

export type ProjektJednotkaSazby = "hodina" | "md";

/** Efektivní délka práce — 0 h znamená celý pracovní den (8 h). */
export function effectiveWorkHours(hodiny: number, minuty: number): number {
  if (hodiny === 0 && minuty === 0) return MD_HOURS;
  return hodiny + minuty / 60;
}

/** Počet fakturačních jednotek (h nebo MD) podle nastavení projektu. */
export function billingUnits(
  hodiny: number,
  minuty: number,
  jednotka: ProjektJednotkaSazby = "hodina",
): number {
  const hours = effectiveWorkHours(hodiny, minuty);
  return jednotka === "md" ? hours / MD_HOURS : hours;
}

export function computeCastkaFakturace(
  hodiny: number,
  minuty: number,
  sazba: string | number | null | undefined,
  jednotka: ProjektJednotkaSazby = "hodina",
): number {
  const rate = sazba == null || sazba === "" ? 0 : Number(sazba);
  if (!Number.isFinite(rate)) return 0;
  return Math.round(billingUnits(hodiny, minuty, jednotka) * rate * 100) / 100;
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
  jednotka: ProjektJednotkaSazby = "hodina",
): number {
  if (sazba != null && sazba !== "") {
    const expected = computeCastkaFakturace(hodiny, minuty, sazba, jednotka);
    const storedNum =
      stored === null || stored === undefined || stored === "" ? NaN : Number(stored);
    if (Number.isFinite(storedNum) && Math.abs(storedNum - expected) < 0.005) {
      return storedNum;
    }
    return expected;
  }
  const num = stored === null || stored === undefined || stored === "" ? 0 : Number(stored);
  return Number.isFinite(num) ? num : 0;
}
