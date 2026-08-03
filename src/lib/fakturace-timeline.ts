import { MONTH_LABELS } from "@/lib/calendar";
import type { SluzbaFrekvence } from "@/lib/types";
import { toDateIso } from "@/lib/format";

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Stejná logika jako crmissp.calc_dalsi_fakturace v DB. */
export function calcDalsiFakturace(
  posledniPlatba: string,
  frekvence: SluzbaFrekvence | null,
  frekvenceDnu: number | null,
): string | null {
  const d = parseIso(posledniPlatba);
  const y = d.getFullYear();
  const month = d.getMonth() + 1;

  switch (frekvence) {
    case "mesicne": {
      const next = new Date(y, d.getMonth() + 1, 1);
      return toIso(next);
    }
    case "kvartalne": {
      const qStartMonth = Math.floor(d.getMonth() / 3) * 3;
      const next = new Date(y, qStartMonth + 3, 1);
      return toIso(next);
    }
    case "pololetne": {
      if (month <= 6) return toIso(new Date(y, 6, 1));
      return toIso(new Date(y + 1, 0, 1));
    }
    case "rocne": {
      return toIso(new Date(y + 1, d.getMonth(), 1));
    }
    default:
      if (frekvenceDnu && frekvenceDnu > 0) {
        const next = new Date(d);
        next.setDate(next.getDate() + frekvenceDnu);
        return toIso(next);
      }
      return null;
  }
}

function prevBillingDate(
  date: string,
  frekvence: SluzbaFrekvence | null,
  frekvenceDnu: number | null,
): string | null {
  const d = parseIso(date);
  const y = d.getFullYear();
  const month = d.getMonth() + 1;

  switch (frekvence) {
    case "mesicne":
      return toIso(new Date(y, d.getMonth() - 1, 1));
    case "kvartalne": {
      const qStartMonth = Math.floor(d.getMonth() / 3) * 3;
      return toIso(new Date(y, qStartMonth - 3, 1));
    }
    case "pololetne": {
      if (month <= 6) return toIso(new Date(y - 1, 6, 1));
      return toIso(new Date(y, 0, 1));
    }
    case "rocne":
      return toIso(new Date(y - 1, d.getMonth(), 1));
    default:
      if (frekvenceDnu && frekvenceDnu > 0) {
        const prev = new Date(d);
        prev.setDate(prev.getDate() - frekvenceDnu);
        return toIso(prev);
      }
      return null;
  }
}

export function projectSluzbaBillingDates(
  anchor: string,
  frekvence: SluzbaFrekvence | null,
  frekvenceDnu: number | null,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  const dates = new Set<string>();
  const start = parseIso(rangeStart);
  const end = parseIso(rangeEnd);

  let current = anchor;
  let guard = 0;
  while (current && parseIso(current) >= start && guard < 48) {
    dates.add(current);
    const prev = prevBillingDate(current, frekvence, frekvenceDnu);
    if (!prev || prev === current) break;
    current = prev;
    guard++;
  }

  current = anchor;
  guard = 0;
  while (current && parseIso(current) <= end && guard < 48) {
    dates.add(current);
    const next = calcDalsiFakturace(current, frekvence, frekvenceDnu);
    if (!next || next === current) break;
    current = next;
    guard++;
  }

  return [...dates]
    .filter((iso) => parseIso(iso) >= start && parseIso(iso) <= end)
    .sort();
}

export function timelineMonthRange(monthsBack = 6, monthsForward = 6): {
  months: { key: string; label: string; isCurrent: boolean }[];
  rangeStart: string;
  rangeEnd: string;
} {
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const months: { key: string; label: string; isCurrent: boolean }[] = [];
  for (let offset = -monthsBack; offset <= monthsForward; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      key,
      label: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
      isCurrent: key === currentKey,
    });
  }

  const first = months[0].key.split("-").map(Number);
  const last = months[months.length - 1].key.split("-").map(Number);
  const rangeStart = toIso(new Date(first[0], first[1] - 1, 1));
  const rangeEnd = toIso(new Date(last[0], last[1], 0));

  return { months, rangeStart, rangeEnd };
}

export type TimelineSluzbaItem = {
  id: string;
  nazev: string;
  zakaznikNazev: string;
  castka: string | null;
  mena: string;
  datum: string;
  monthKey: string;
};

export type TimelinePraceItem = {
  zakaznikId: string;
  zakaznikNazev: string;
  projektId: string;
  projektNazev: string;
  pocet: number;
  castka: number;
  monthKey: string;
};

export type TimelineFakturaItem = {
  id: string;
  cislo: string | null;
  zakaznikNazev: string;
  castka: string | null;
  stav: string;
  datum: string;
  monthKey: string;
};

export type TimelineMonthData = {
  key: string;
  label: string;
  isCurrent: boolean;
  sluzby: TimelineSluzbaItem[];
  prace: TimelinePraceItem[];
  faktury: TimelineFakturaItem[];
};

export function emptyTimeline(months: { key: string; label: string; isCurrent: boolean }[]): TimelineMonthData[] {
  return months.map((m) => ({
    ...m,
    sluzby: [],
    prace: [],
    faktury: [],
  }));
}

export function assignSluzby(timeline: TimelineMonthData[], items: TimelineSluzbaItem[]) {
  const byKey = new Map(timeline.map((m) => [m.key, m]));
  for (const item of items) {
    byKey.get(item.monthKey)?.sluzby.push(item);
  }
}

export function assignPrace(timeline: TimelineMonthData[], items: TimelinePraceItem[]) {
  const byKey = new Map(timeline.map((m) => [m.key, m]));
  for (const item of items) {
    byKey.get(item.monthKey)?.prace.push(item);
  }
}

export function assignFaktury(timeline: TimelineMonthData[], items: TimelineFakturaItem[]) {
  const byKey = new Map(timeline.map((m) => [m.key, m]));
  for (const item of items) {
    byKey.get(item.monthKey)?.faktury.push(item);
  }
}

export function sluzbaToTimelineItems(
  sluzba: {
    id: string;
    nazev_sluzby: string;
    zakaznik_nazev?: string;
    cena_periody: string | null;
    mena: string;
    frekvence: SluzbaFrekvence | null;
    frekvence_dnu: number | null;
    dalsi_fakturace: string | null;
  },
  rangeStart: string,
  rangeEnd: string,
): TimelineSluzbaItem[] {
  const anchor = sluzba.dalsi_fakturace ? toDateIso(sluzba.dalsi_fakturace) : null;
  if (!anchor) return [];

  const dates = projectSluzbaBillingDates(
    anchor,
    sluzba.frekvence,
    sluzba.frekvence_dnu,
    rangeStart,
    rangeEnd,
  );

  return dates.map((datum) => ({
    id: sluzba.id,
    nazev: sluzba.nazev_sluzby,
    zakaznikNazev: sluzba.zakaznik_nazev ?? "—",
    castka: sluzba.cena_periody,
    mena: sluzba.mena,
    datum,
    monthKey: monthKey(datum),
  }));
}
