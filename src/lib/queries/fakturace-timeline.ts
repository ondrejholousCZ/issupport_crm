import { query } from "@/lib/db";
import type { Faktura, Sluzba } from "@/lib/types";
import {
  assignFaktury,
  assignPrace,
  assignSluzby,
  emptyTimeline,
  sluzbaToTimelineItems,
  timelineMonthRange,
  type TimelineFakturaItem,
  type TimelineMonthData,
  type TimelinePraceItem,
} from "@/lib/fakturace-timeline";
import { toDateIso } from "@/lib/format";

export async function buildFakturaceTimeline(): Promise<TimelineMonthData[]> {
  const { months, rangeStart, rangeEnd } = timelineMonthRange(6, 6);
  const timeline = emptyTimeline(months);

  const [sluzby, praceRows, faktury] = await Promise.all([
    query<Sluzba>(
      `SELECT s.*, z.nazev AS zakaznik_nazev
       FROM sluzba s
       JOIN zakaznik z ON z.id = s.zakaznik_id
       WHERE s.stav = 'aktivni' AND s.dalsi_fakturace IS NOT NULL
       ORDER BY s.dalsi_fakturace`,
    ),
    query<{
      mesic: string;
      zakaznik_id: string;
      zakaznik_nazev: string;
      projekt_id: string;
      projekt_nazev: string;
      projekt_zakazka: string;
      pocet: number;
      castka: string;
    }>(
      `SELECT
         to_char(op.datum, 'YYYY-MM') AS mesic,
         op.zakaznik_id,
         z.nazev AS zakaznik_nazev,
         op.projekt_id,
         p.nazev_projektu AS projekt_nazev,
         COALESCE(NULLIF(TRIM(p.zakazka), ''), p.nazev_projektu) AS projekt_zakazka,
         COUNT(*)::int AS pocet,
         COALESCE(SUM(op.castka_fakturace), 0)::text AS castka
       FROM odvedena_prace op
       JOIN zakaznik z ON z.id = op.zakaznik_id
       JOIN projekt p ON p.id = op.projekt_id
       WHERE op.stav_fakturace = 'nefakturovano'
         AND op.datum >= $1::date
         AND op.datum <= $2::date
       GROUP BY 1, 2, 3, 4, 5, 6
       ORDER BY 1, z.nazev, p.nazev_projektu`,
      [rangeStart, rangeEnd],
    ),
    query<Faktura>(
      `SELECT f.*, z.nazev AS zakaznik_nazev
       FROM faktura f
       JOIN zakaznik z ON z.id = f.zakaznik_id
       WHERE f.datum_vystaveni IS NOT NULL
         AND f.stav != 'storno'
         AND f.datum_vystaveni >= $1::date
         AND f.datum_vystaveni <= $2::date
       ORDER BY f.datum_vystaveni`,
      [rangeStart, rangeEnd],
    ),
  ]);

  const sluzbaItems = sluzby.rows.flatMap((s) =>
    sluzbaToTimelineItems(s, rangeStart, rangeEnd),
  );
  assignSluzby(timeline, sluzbaItems);

  const praceItems: TimelinePraceItem[] = praceRows.rows.map((r) => ({
    zakaznikId: r.zakaznik_id,
    zakaznikNazev: r.zakaznik_nazev,
    projektId: r.projekt_id,
    projektZakazka: r.projekt_zakazka,
    projektNazev: r.projekt_nazev,
    pocet: r.pocet,
    castka: Number(r.castka),
    monthKey: r.mesic,
  }));
  assignPrace(timeline, praceItems);

  const fakturaItems: TimelineFakturaItem[] = faktury.rows.map((f) => {
    const datum = toDateIso(f.datum_vystaveni);
    return {
      id: f.id,
      cislo: f.cislo_faktury,
      zakaznikNazev: f.zakaznik_nazev ?? "—",
      castka: f.castka_celkem,
      stav: f.stav,
      datum,
      monthKey: datum.slice(0, 7),
    };
  });
  assignFaktury(timeline, fakturaItems);

  return timeline;
}
