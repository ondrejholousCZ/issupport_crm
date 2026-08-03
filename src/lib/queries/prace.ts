import { query } from "@/lib/db";
import type { OdvedenaPrace } from "@/lib/types";

export async function listPrace(filters?: {
  zakaznikId?: string;
  projektId?: string;
}): Promise<OdvedenaPrace[]> {
  const clauses: string[] = [];
  const params: string[] = [];

  if (filters?.zakaznikId) {
    params.push(filters.zakaznikId);
    clauses.push(`op.zakaznik_id = $${params.length}`);
  }
  if (filters?.projektId) {
    params.push(filters.projektId);
    clauses.push(`op.projekt_id = $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await query<OdvedenaPrace>(
    `SELECT op.*,
            z.nazev AS zakaznik_nazev,
            p.nazev_projektu AS projekt_nazev,
            p.zakazka AS projekt_zakazka,
            CONCAT(pr.prijmeni, ' ', pr.jmeno) AS pracovnik_jmeno
     FROM odvedena_prace op
     JOIN zakaznik z ON z.id = op.zakaznik_id
     JOIN projekt p ON p.id = op.projekt_id
     JOIN pracovnik pr ON pr.id = op.pracovnik_id
     ${where}
     ORDER BY op.datum DESC, op.created_at DESC`,
    params.length ? params : undefined,
  );
  return result.rows;
}

export async function getPrace(id: string): Promise<OdvedenaPrace | null> {
  const result = await query<OdvedenaPrace>(
    `SELECT op.*,
            z.nazev AS zakaznik_nazev,
            p.nazev_projektu AS projekt_nazev,
            p.zakazka AS projekt_zakazka,
            CONCAT(pr.prijmeni, ' ', pr.jmeno) AS pracovnik_jmeno
     FROM odvedena_prace op
     JOIN zakaznik z ON z.id = op.zakaznik_id
     JOIN projekt p ON p.id = op.projekt_id
     JOIN pracovnik pr ON pr.id = op.pracovnik_id
     WHERE op.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createPrace(data: {
  datum: string;
  hodiny: number;
  minuty: number;
  druh_cinnosti?: string;
  zakaznik_id: string;
  projekt_id: string;
  pracovnik_id: string;
  popis?: string;
  stav_fakturace: string;
  faktura_id?: string;
}) {
  const result = await query<OdvedenaPrace>(
    `INSERT INTO odvedena_prace (
      datum, hodiny, minuty, druh_cinnosti, zakaznik_id, projekt_id,
      pracovnik_id, popis, stav_fakturace, faktura_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      data.datum,
      data.hodiny,
      data.minuty,
      data.druh_cinnosti || null,
      data.zakaznik_id,
      data.projekt_id,
      data.pracovnik_id,
      data.popis || null,
      data.stav_fakturace,
      data.faktura_id || null,
    ],
  );
  return result.rows[0];
}

export async function updatePrace(
  id: string,
  data: {
    datum: string;
    hodiny: number;
    minuty: number;
    druh_cinnosti?: string;
    zakaznik_id: string;
    projekt_id: string;
    pracovnik_id: string;
    popis?: string;
    stav_fakturace: string;
    faktura_id?: string;
  },
) {
  const result = await query<OdvedenaPrace>(
    `UPDATE odvedena_prace SET
      datum = $2, hodiny = $3, minuty = $4, druh_cinnosti = $5,
      zakaznik_id = $6, projekt_id = $7, pracovnik_id = $8,
      popis = $9, stav_fakturace = $10, faktura_id = $11
     WHERE id = $1 RETURNING *`,
    [
      id,
      data.datum,
      data.hodiny,
      data.minuty,
      data.druh_cinnosti || null,
      data.zakaznik_id,
      data.projekt_id,
      data.pracovnik_id,
      data.popis || null,
      data.stav_fakturace,
      data.faktura_id || null,
    ],
  );
  return result.rows[0];
}

export async function deletePrace(id: string) {
  await query(`DELETE FROM odvedena_prace WHERE id = $1`, [id]);
}

export async function deletePraceBulk(ids: string[]) {
  if (ids.length === 0) return;
  await query(`DELETE FROM odvedena_prace WHERE id = ANY($1::uuid[])`, [ids]);
}
