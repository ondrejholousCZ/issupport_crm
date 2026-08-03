export function currentMesic(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
