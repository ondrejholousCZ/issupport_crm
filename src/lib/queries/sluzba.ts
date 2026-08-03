import { query } from "@/lib/db";
import type { Sluzba } from "@/lib/types";

export async function listSluzby(zakaznikId?: string): Promise<Sluzba[]> {
  const result = await query<Sluzba>(
    zakaznikId
      ? `SELECT s.*, z.nazev AS zakaznik_nazev
         FROM sluzba s JOIN zakaznik z ON z.id = s.zakaznik_id
         WHERE s.zakaznik_id = $1
         ORDER BY s.dalsi_fakturace ASC NULLS LAST, s.nazev_sluzby`
      : `SELECT s.*, z.nazev AS zakaznik_nazev
         FROM sluzba s JOIN zakaznik z ON z.id = s.zakaznik_id
         ORDER BY s.dalsi_fakturace ASC NULLS LAST, s.nazev_sluzby`,
    zakaznikId ? [zakaznikId] : undefined,
  );
  return result.rows;
}

export async function getSluzba(id: string): Promise<Sluzba | null> {
  const result = await query<Sluzba>(
    `SELECT s.*, z.nazev AS zakaznik_nazev
     FROM sluzba s JOIN zakaznik z ON z.id = s.zakaznik_id
     WHERE s.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createSluzba(data: {
  zakaznik_id: string;
  nazev_sluzby: string;
  frekvence?: string;
  frekvence_dnu?: number | null;
  cena_periody?: string;
  mena: string;
  posledni_platba?: string;
  stav: string;
}) {
  const result = await query<Sluzba>(
    `INSERT INTO sluzba (zakaznik_id, nazev_sluzby, frekvence, frekvence_dnu, cena_periody, mena, posledni_platba, stav)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      data.zakaznik_id,
      data.nazev_sluzby,
      data.frekvence || null,
      data.frekvence_dnu ?? null,
      data.cena_periody || null,
      data.mena,
      data.posledni_platba || null,
      data.stav,
    ],
  );
  return result.rows[0];
}

export async function updateSluzba(
  id: string,
  data: {
    zakaznik_id: string;
    nazev_sluzby: string;
    frekvence?: string;
    frekvence_dnu?: number | null;
    cena_periody?: string;
    mena: string;
    posledni_platba?: string;
    stav: string;
  },
) {
  const result = await query<Sluzba>(
    `UPDATE sluzba SET
      zakaznik_id = $2, nazev_sluzby = $3, frekvence = $4, frekvence_dnu = $5,
      cena_periody = $6, mena = $7, posledni_platba = $8, stav = $9
     WHERE id = $1 RETURNING *`,
    [
      id,
      data.zakaznik_id,
      data.nazev_sluzby,
      data.frekvence || null,
      data.frekvence_dnu ?? null,
      data.cena_periody || null,
      data.mena,
      data.posledni_platba || null,
      data.stav,
    ],
  );
  return result.rows[0];
}

export async function deleteSluzba(id: string) {
  await query(`DELETE FROM sluzba WHERE id = $1`, [id]);
}

export async function listSluzbyDueSoon(days = 30) {
  const result = await query<Sluzba>(
    `SELECT s.*, z.nazev AS zakaznik_nazev
     FROM sluzba s JOIN zakaznik z ON z.id = s.zakaznik_id
     WHERE s.stav = 'aktivni'
       AND s.dalsi_fakturace IS NOT NULL
       AND s.dalsi_fakturace <= CURRENT_DATE + ($1::int * INTERVAL '1 day')
     ORDER BY s.dalsi_fakturace`,
    [String(days)],
  );
  return result.rows;
}

export async function listSluzbaOptions(zakaznikId?: string) {
  const result = await query<{ id: string; label: string; zakaznik_id: string }>(
    zakaznikId
      ? `SELECT id, nazev_sluzby AS label, zakaznik_id FROM sluzba WHERE zakaznik_id = $1 AND stav = 'aktivni' ORDER BY nazev_sluzby`
      : `SELECT id, nazev_sluzby AS label, zakaznik_id FROM sluzba WHERE stav = 'aktivni' ORDER BY nazev_sluzby`,
    zakaznikId ? [zakaznikId] : undefined,
  );
  return result.rows;
}
