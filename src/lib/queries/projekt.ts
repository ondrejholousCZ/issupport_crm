import { query } from "@/lib/db";
import type { Projekt } from "@/lib/types";

export async function listProjekty(zakaznikId?: string): Promise<Projekt[]> {
  const result = await query<Projekt>(
    zakaznikId
      ? `SELECT p.*, z.nazev AS zakaznik_nazev
         FROM projekt p JOIN zakaznik z ON z.id = p.zakaznik_id
         WHERE p.zakaznik_id = $1
         ORDER BY p.nazev_projektu`
      : `SELECT p.*, z.nazev AS zakaznik_nazev
         FROM projekt p JOIN zakaznik z ON z.id = p.zakaznik_id
         ORDER BY p.nazev_projektu`,
    zakaznikId ? [zakaznikId] : undefined,
  );
  return result.rows;
}

export async function getProjekt(id: string): Promise<Projekt | null> {
  const result = await query<Projekt>(
    `SELECT p.*, z.nazev AS zakaznik_nazev
     FROM projekt p JOIN zakaznik z ON z.id = p.zakaznik_id
     WHERE p.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createProjekt(data: {
  nazev_projektu: string;
  zakazka?: string;
  zakaznik_id: string;
  datum_od?: string;
  datum_do?: string;
  hodinova_sazba_fak?: string;
  jednotka_sazby?: string;
  mena: string;
  stav: string;
}) {
  const result = await query<Projekt>(
    `INSERT INTO projekt (nazev_projektu, zakazka, zakaznik_id, datum_od, datum_do, hodinova_sazba_fak, jednotka_sazby, mena, stav)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      data.nazev_projektu,
      data.zakazka || null,
      data.zakaznik_id,
      data.datum_od || null,
      data.datum_do || null,
      data.hodinova_sazba_fak || null,
      data.jednotka_sazby || "hodina",
      data.mena,
      data.stav,
    ],
  );
  return result.rows[0];
}

export async function updateProjekt(
  id: string,
  data: {
    nazev_projektu: string;
    zakazka?: string;
    zakaznik_id: string;
    datum_od?: string;
    datum_do?: string;
    hodinova_sazba_fak?: string;
    jednotka_sazby?: string;
    mena: string;
    stav: string;
  },
) {
  const result = await query<Projekt>(
    `UPDATE projekt SET
      nazev_projektu = $2, zakazka = $3, zakaznik_id = $4, datum_od = $5, datum_do = $6,
      hodinova_sazba_fak = $7, jednotka_sazby = $8, mena = $9, stav = $10
     WHERE id = $1 RETURNING *`,
    [
      id,
      data.nazev_projektu,
      data.zakazka || null,
      data.zakaznik_id,
      data.datum_od || null,
      data.datum_do || null,
      data.hodinova_sazba_fak || null,
      data.jednotka_sazby || "hodina",
      data.mena,
      data.stav,
    ],
  );
  return result.rows[0];
}

export async function deleteProjekt(id: string) {
  await query(`DELETE FROM projekt WHERE id = $1`, [id]);
}

export async function listDistinctProjektNazvy(): Promise<{ id: string; label: string }[]> {
  const result = await query<{ nazev: string }>(
    `SELECT DISTINCT nazev_projektu AS nazev FROM projekt ORDER BY nazev_projektu`,
  );
  return result.rows.map((r) => ({ id: r.nazev, label: r.nazev }));
}

export async function listProjektOptions(zakaznikId?: string) {
  const result = await query<{ id: string; label: string; zakaznik_id: string }>(
    zakaznikId
      ? `SELECT p.id,
                COALESCE(NULLIF(p.zakazka, ''), p.nazev_projektu) AS label,
                p.zakaznik_id
         FROM projekt p WHERE p.zakaznik_id = $1 AND p.stav = 'aktivni'
         ORDER BY p.nazev_projektu`
      : `SELECT p.id,
                CONCAT(
                  z.nazev, ' — ',
                  COALESCE(NULLIF(p.zakazka, ''), p.nazev_projektu),
                  CASE WHEN p.zakazka IS NOT NULL AND p.zakazka <> '' THEN CONCAT(' (', p.nazev_projektu, ')') ELSE '' END
                ) AS label,
                p.zakaznik_id
         FROM projekt p JOIN zakaznik z ON z.id = p.zakaznik_id
         WHERE p.stav = 'aktivni'
         ORDER BY z.nazev, p.nazev_projektu`,
    zakaznikId ? [zakaznikId] : undefined,
  );
  return result.rows;
}
