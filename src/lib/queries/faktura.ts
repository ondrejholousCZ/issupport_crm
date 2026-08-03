import { query } from "@/lib/db";
import type { Faktura } from "@/lib/types";

export async function listFaktury(zakaznikId?: string): Promise<Faktura[]> {
  const result = await query<Faktura>(
    zakaznikId
      ? `SELECT f.*, z.nazev AS zakaznik_nazev, p.nazev_projektu AS projekt_nazev, s.nazev_sluzby AS sluzba_nazev
         FROM faktura f
         JOIN zakaznik z ON z.id = f.zakaznik_id
         LEFT JOIN projekt p ON p.id = f.projekt_id
         LEFT JOIN sluzba s ON s.id = f.sluzba_id
         WHERE f.zakaznik_id = $1
         ORDER BY f.datum_vystaveni DESC NULLS LAST, f.created_at DESC`
      : `SELECT f.*, z.nazev AS zakaznik_nazev, p.nazev_projektu AS projekt_nazev, s.nazev_sluzby AS sluzba_nazev
         FROM faktura f
         JOIN zakaznik z ON z.id = f.zakaznik_id
         LEFT JOIN projekt p ON p.id = f.projekt_id
         LEFT JOIN sluzba s ON s.id = f.sluzba_id
         ORDER BY f.datum_vystaveni DESC NULLS LAST, f.created_at DESC`,
    zakaznikId ? [zakaznikId] : undefined,
  );
  return result.rows;
}

export async function getFaktura(id: string): Promise<Faktura | null> {
  const result = await query<Faktura>(
    `SELECT f.*, z.nazev AS zakaznik_nazev, p.nazev_projektu AS projekt_nazev, s.nazev_sluzby AS sluzba_nazev
     FROM faktura f
     JOIN zakaznik z ON z.id = f.zakaznik_id
     LEFT JOIN projekt p ON p.id = f.projekt_id
     LEFT JOIN sluzba s ON s.id = f.sluzba_id
     WHERE f.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createFaktura(data: {
  cislo_faktury?: string;
  zakaznik_id: string;
  projekt_id?: string;
  sluzba_id?: string;
  datum_vystaveni?: string;
  datum_splatnosti?: string;
  datum_uhrazeni?: string;
  castka_bez_dph?: string;
  dph_sazba?: string;
  castka_celkem?: string;
  stav: string;
  typ_faktury?: string;
  external_ref?: string;
}) {
  const result = await query<Faktura>(
    `INSERT INTO faktura (
      cislo_faktury, zakaznik_id, projekt_id, sluzba_id,
      datum_vystaveni, datum_splatnosti, datum_uhrazeni,
      castka_bez_dph, dph_sazba, castka_celkem, stav, typ_faktury, external_ref
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [
      data.cislo_faktury || null,
      data.zakaznik_id,
      data.projekt_id || null,
      data.sluzba_id || null,
      data.datum_vystaveni || null,
      data.datum_splatnosti || null,
      data.datum_uhrazeni || null,
      data.castka_bez_dph || null,
      data.dph_sazba || "21",
      data.castka_celkem || null,
      data.stav,
      data.typ_faktury || null,
      data.external_ref || null,
    ],
  );
  return result.rows[0];
}

export async function updateFaktura(
  id: string,
  data: {
    cislo_faktury?: string;
    zakaznik_id: string;
    projekt_id?: string;
    sluzba_id?: string;
    datum_vystaveni?: string;
    datum_splatnosti?: string;
    datum_uhrazeni?: string;
    castka_bez_dph?: string;
    dph_sazba?: string;
    castka_celkem?: string;
    stav: string;
    typ_faktury?: string;
    external_ref?: string;
  },
) {
  const result = await query<Faktura>(
    `UPDATE faktura SET
      cislo_faktury = $2, zakaznik_id = $3, projekt_id = $4, sluzba_id = $5,
      datum_vystaveni = $6, datum_splatnosti = $7, datum_uhrazeni = $8,
      castka_bez_dph = $9, dph_sazba = $10, castka_celkem = $11,
      stav = $12, typ_faktury = $13, external_ref = $14
     WHERE id = $1 RETURNING *`,
    [
      id,
      data.cislo_faktury || null,
      data.zakaznik_id,
      data.projekt_id || null,
      data.sluzba_id || null,
      data.datum_vystaveni || null,
      data.datum_splatnosti || null,
      data.datum_uhrazeni || null,
      data.castka_bez_dph || null,
      data.dph_sazba || "21",
      data.castka_celkem || null,
      data.stav,
      data.typ_faktury || null,
      data.external_ref || null,
    ],
  );
  return result.rows[0];
}

export async function deleteFaktura(id: string) {
  await query(`DELETE FROM faktura WHERE id = $1`, [id]);
}

export async function markOverdueInvoices() {
  const result = await query(
    `UPDATE faktura SET stav = 'po_splatnosti'
     WHERE stav = 'vystavena' AND datum_splatnosti < CURRENT_DATE`,
  );
  return result.rowCount ?? 0;
}
