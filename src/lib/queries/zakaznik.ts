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
  ic_dph?: string;
  kontaktni_email?: string;
  kontaktni_telefon?: string;
  fakturacni_ulice?: string;
  fakturacni_mesto?: string;
  fakturacni_psc?: string;
  postup_fakturace?: string;
  stav: string;
}) {
  const result = await query<Zakaznik>(
    `INSERT INTO zakaznik (
      ico, nazev, ic_dph, kontaktni_email, kontaktni_telefon,
      fakturacni_ulice, fakturacni_mesto, fakturacni_psc, postup_fakturace, stav
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *`,
    [
      data.ico || null,
      data.nazev,
      data.ic_dph || null,
      data.kontaktni_email || null,
      data.kontaktni_telefon || null,
      data.fakturacni_ulice || null,
      data.fakturacni_mesto || null,
      data.fakturacni_psc || null,
      data.postup_fakturace || null,
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
    ic_dph?: string;
    kontaktni_email?: string;
    kontaktni_telefon?: string;
    fakturacni_ulice?: string;
    fakturacni_mesto?: string;
    fakturacni_psc?: string;
    postup_fakturace?: string;
    stav: string;
  },
) {
  const result = await query<Zakaznik>(
    `UPDATE zakaznik SET
      ico = $2, nazev = $3, ic_dph = $4, kontaktni_email = $5, kontaktni_telefon = $6,
      fakturacni_ulice = $7, fakturacni_mesto = $8, fakturacni_psc = $9,
      postup_fakturace = $10, stav = $11
    WHERE id = $1
    RETURNING *`,
    [
      id,
      data.ico || null,
      data.nazev,
      data.ic_dph || null,
      data.kontaktni_email || null,
      data.kontaktni_telefon || null,
      data.fakturacni_ulice || null,
      data.fakturacni_mesto || null,
      data.fakturacni_psc || null,
      data.postup_fakturace || null,
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
