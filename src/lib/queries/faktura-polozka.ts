import { query } from "@/lib/db";
import type { FakturaPolozka } from "@/lib/types";

export async function listFakturaPolozky(fakturaId: string): Promise<FakturaPolozka[]> {
  const result = await query<FakturaPolozka>(
    `SELECT * FROM faktura_polozka WHERE faktura_id = $1 ORDER BY poradi, created_at`,
    [fakturaId],
  );
  return result.rows;
}

export async function replaceFakturaPolozky(
  fakturaId: string,
  polozky: Array<{
    nazev: string;
    mnozstvi: number;
    jednotka: string;
    cena_jednotka: number;
    dph_sazba: number;
  }>,
) {
  await query(`DELETE FROM faktura_polozka WHERE faktura_id = $1`, [fakturaId]);
  for (let i = 0; i < polozky.length; i++) {
    const p = polozky[i];
    await query(
      `INSERT INTO faktura_polozka (faktura_id, nazev, mnozstvi, jednotka, cena_jednotka, dph_sazba, poradi)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [fakturaId, p.nazev, p.mnozstvi, p.jednotka, p.cena_jednotka, p.dph_sazba, i],
    );
  }
}
