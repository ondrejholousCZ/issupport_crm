export function currentMesic(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const MESICE_LABELS = [
  "Leden",
  "Únor",
  "Březen",
  "Duben",
  "Květen",
  "Červen",
  "Červenec",
  "Srpen",
  "Září",
  "Říjen",
  "Listopad",
  "Prosinec",
] as const;

export function splitMesic(mesic: string): { rok: number; mesic: number } {
  const [rokStr, mesicStr] = mesic.split("-");
  return {
    rok: Number(rokStr) || new Date().getFullYear(),
    mesic: Number(mesicStr) || new Date().getMonth() + 1,
  };
}

export function buildMesic(rok: number, mesic: number): string {
  return `${rok}-${String(mesic).padStart(2, "0")}`;
}

export function rokyProFiltr(): number[] {
  const current = new Date().getFullYear();
  const roky: number[] = [];
  for (let y = current - 5; y <= current + 1; y++) roky.push(y);
  return roky;
}

export type PraceFilters = {
  mesic: string;
  pracovnikId?: string;
  projektId?: string;
  zakaznikId?: string;
  stav?: string;
};

export function parsePraceFilters(params: Record<string, string | undefined>): PraceFilters {
  return {
    mesic: params.mesic && /^\d{4}-\d{2}$/.test(params.mesic) ? params.mesic : currentMesic(),
    pracovnikId: params.pracovnik || undefined,
    projektId: params.projekt || undefined,
    zakaznikId: params.zakaznik || undefined,
    stav: params.stav || undefined,
  };
}

export function praceFiltersToQuery(filters: PraceFilters, extra?: Record<string, string>): string {
  const q = new URLSearchParams();
  q.set("mesic", filters.mesic);
  if (filters.pracovnikId) q.set("pracovnik", filters.pracovnikId);
  if (filters.projektId) q.set("projekt", filters.projektId);
  if (filters.zakaznikId) q.set("zakaznik", filters.zakaznikId);
  if (filters.stav) q.set("stav", filters.stav);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) q.set(k, v);
    }
  }
  return q.toString();
}
