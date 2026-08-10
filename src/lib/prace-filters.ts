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

export function splitMesic(mesic: string): { rok: number; mesic: number | null } {
  if (/^\d{4}$/.test(mesic)) {
    return { rok: Number(mesic), mesic: null };
  }
  const [rokStr, mesicStr] = mesic.split("-");
  return {
    rok: Number(rokStr) || new Date().getFullYear(),
    mesic: Number(mesicStr) || new Date().getMonth() + 1,
  };
}

export function isCelyRok(obdobi: string): boolean {
  return /^\d{4}$/.test(obdobi);
}

export function isMesicObdobi(obdobi: string): boolean {
  return /^\d{4}-\d{2}$/.test(obdobi);
}

export function isValidObdobi(obdobi: string): boolean {
  return isCelyRok(obdobi) || isMesicObdobi(obdobi);
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
  pracovnikIds: string[];
  projektZakazky: string[];
  zakaznikIds: string[];
  stav: string[];
};

function parseCsv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinCsv(values: string[]): string | undefined {
  return values.length ? values.join(",") : undefined;
}

export function parsePraceFilters(params: Record<string, string | undefined>): PraceFilters {
  return {
    mesic:
      params.mesic && isValidObdobi(params.mesic) ? params.mesic : currentMesic(),
    pracovnikIds: parseCsv(params.pracovnik),
    projektZakazky: parseCsv(params.projekt),
    zakaznikIds: parseCsv(params.zakaznik),
    stav: parseCsv(params.stav),
  };
}

export function praceFiltersToSearchParams(filters: PraceFilters): URLSearchParams {
  const q = new URLSearchParams();
  q.set("mesic", filters.mesic);
  const pracovnik = joinCsv(filters.pracovnikIds);
  const projekt = joinCsv(filters.projektZakazky);
  const zakaznik = joinCsv(filters.zakaznikIds);
  const stav = joinCsv(filters.stav);
  if (pracovnik) q.set("pracovnik", pracovnik);
  if (projekt) q.set("projekt", projekt);
  if (zakaznik) q.set("zakaznik", zakaznik);
  if (stav) q.set("stav", stav);
  return q;
}

export function praceFiltersToQuery(filters: PraceFilters, extra?: Record<string, string>): string {
  const q = praceFiltersToSearchParams(filters);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) q.set(k, v);
    }
  }
  return q.toString();
}
