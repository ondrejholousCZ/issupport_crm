import { query } from "@/lib/db";
import type { Zakaznik } from "@/lib/types";

export async function listZakaznici(): Promise<Zakaznik[]> {
  const result = await query<Zakaznik>(
    `SELECT * FROM zakaznik ORDER BY nazev ASC`,
  );
  return result.rows;
}

export async function getZakaznik(id: string): Promise<Zakaznik | null> {
  const result = await query<Zakaznik>(`SELECT * FROM zakaznik WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function createZakaznik(data: {
  ico?: string;
  nazev: string;
  zkratka?: string;
  kontaktni_email?: string;
  fakturacni_email?: string;
  kontaktni_telefon?: string;
  fakturacni_ulice?: string;
  fakturacni_mesto?: string;
  fakturacni_psc?: string;
  postup_fakturace?: string;
  idoklad_partner_id?: number | null;
  stav: string;
}) {
  const result = await query<Zakaznik>(
    `INSERT INTO zakaznik (
      ico, nazev, zkratka, kontaktni_email, fakturacni_email, kontaktni_telefon,
      fakturacni_ulice, fakturacni_mesto, fakturacni_psc, postup_fakturace, idoklad_partner_id, stav
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [
      data.ico || null,
      data.nazev,
      data.zkratka || null,
      data.kontaktni_email || null,
      data.fakturacni_email || null,
      data.kontaktni_telefon || null,
      data.fakturacni_ulice || null,
      data.fakturacni_mesto || null,
      data.fakturacni_psc || null,
      data.postup_fakturace || null,
      data.idoklad_partner_id ?? null,
      data.stav,
    ],
  );
  return result.rows[0];
}

export async function updateZakaznik(
  id: string,
  data: {
    ico?: string;
    nazev: string;
    zkratka?: string;
    kontaktni_email?: string;
    fakturacni_email?: string;
    kontaktni_telefon?: string;
    fakturacni_ulice?: string;
    fakturacni_mesto?: string;
    fakturacni_psc?: string;
    postup_fakturace?: string;
    idoklad_partner_id?: number | null;
    stav: string;
  },
) {
  const result = await query<Zakaznik>(
    `UPDATE zakaznik SET
      ico = $2, nazev = $3, zkratka = $4, kontaktni_email = $5, fakturacni_email = $6, kontaktni_telefon = $7,
      fakturacni_ulice = $8, fakturacni_mesto = $9, fakturacni_psc = $10,
      postup_fakturace = $11, idoklad_partner_id = $12, stav = $13
    WHERE id = $1
    RETURNING *`,
    [
      id,
      data.ico || null,
      data.nazev,
      data.zkratka || null,
      data.kontaktni_email || null,
      data.fakturacni_email || null,
      data.kontaktni_telefon || null,
      data.fakturacni_ulice || null,
      data.fakturacni_mesto || null,
      data.fakturacni_psc || null,
      data.postup_fakturace || null,
      data.idoklad_partner_id ?? null,
      data.stav,
    ],
  );
  return result.rows[0];
}

export async function deleteZakaznik(id: string) {
  await query(`DELETE FROM zakaznik WHERE id = $1`, [id]);
}

export async function listZakaznikOptions() {
  const result = await query<{ id: string; nazev: string }>(
    `SELECT id, nazev FROM zakaznik WHERE stav = 'aktivni' ORDER BY nazev`,
  );
  return result.rows;
}
