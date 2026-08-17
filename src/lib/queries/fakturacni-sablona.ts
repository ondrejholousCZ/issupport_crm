import { query } from "@/lib/db";
import type { FakturacniJednotka, FakturacniSablona, DuzpTyp } from "@/lib/types";

export async function getSablonaForProjekt(projektId: string): Promise<FakturacniSablona | null> {
  const result = await query<FakturacniSablona>(
    `SELECT * FROM fakturacni_sablona WHERE projekt_id = $1`,
    [projektId],
  );
  return result.rows[0] ?? null;
}

export async function getSablonyForProjekty(projektIds: string[]): Promise<Map<string, FakturacniSablona>> {
  if (projektIds.length === 0) return new Map();
  const result = await query<FakturacniSablona>(
    `SELECT * FROM fakturacni_sablona WHERE projekt_id = ANY($1::uuid[])`,
    [projektIds],
  );
  return new Map(result.rows.map((r) => [r.projekt_id, r]));
}

export async function upsertSablona(data: {
  projekt_id: string;
  text_sablona: string;
  jednotka: FakturacniJednotka;
  splatnost_dnu: number;
  duzp_typ: DuzpTyp;
  dph_sazba: string;
}) {
  await query(
    `INSERT INTO fakturacni_sablona (projekt_id, text_sablona, jednotka, splatnost_dnu, duzp_typ, dph_sazba)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (projekt_id) DO UPDATE SET
       text_sablona = EXCLUDED.text_sablona,
       jednotka = EXCLUDED.jednotka,
       splatnost_dnu = EXCLUDED.splatnost_dnu,
       duzp_typ = EXCLUDED.duzp_typ,
       dph_sazba = EXCLUDED.dph_sazba`,
    [data.projekt_id, data.text_sablona, data.jednotka, data.splatnost_dnu, data.duzp_typ, data.dph_sazba],
  );
}
