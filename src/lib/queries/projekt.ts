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
  zakaznik_id: string;
  datum_od?: string;
  datum_do?: string;
  hodinova_sazba_fak?: string;
  mena: string;
  stav: string;
}) {
  const result = await query<Projekt>(
    `INSERT INTO projekt (nazev_projektu, zakaznik_id, datum_od, datum_do, hodinova_sazba_fak, mena, stav)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      data.nazev_projektu,
      data.zakaznik_id,
      data.datum_od || null,
      data.datum_do || null,
      data.hodinova_sazba_fak || null,
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
    zakaznik_id: string;
    datum_od?: string;
    datum_do?: string;
    hodinova_sazba_fak?: string;
    mena: string;
    stav: string;
  },
) {
  const result = await query<Projekt>(
    `UPDATE projekt SET
      nazev_projektu = $2, zakaznik_id = $3, datum_od = $4, datum_do = $5,
      hodinova_sazba_fak = $6, mena = $7, stav = $8
     WHERE id = $1 RETURNING *`,
    [
      id,
      data.nazev_projektu,
      data.zakaznik_id,
      data.datum_od || null,
      data.datum_do || null,
      data.hodinova_sazba_fak || null,
      data.mena,
      data.stav,
    ],
  );
  return result.rows[0];
}

export async function deleteProjekt(id: string) {
  await query(`DELETE FROM projekt WHERE id = $1`, [id]);
}

export async function listProjektOptions(zakaznikId?: string) {
  const result = await query<{ id: string; label: string; zakaznik_id: string }>(
    zakaznikId
      ? `SELECT p.id, p.nazev_projektu AS label, p.zakaznik_id
         FROM projekt p WHERE p.zakaznik_id = $1 AND p.stav = 'aktivni'
         ORDER BY p.nazev_projektu`
      : `SELECT p.id, CONCAT(z.nazev, ' — ', p.nazev_projektu) AS label, p.zakaznik_id
         FROM projekt p JOIN zakaznik z ON z.id = p.zakaznik_id
         WHERE p.stav = 'aktivni'
         ORDER BY z.nazev, p.nazev_projektu`,
    zakaznikId ? [zakaznikId] : undefined,
  );
  return result.rows;
}
