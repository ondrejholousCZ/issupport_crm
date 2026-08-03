import { query } from "@/lib/db";
import type { DashboardStats } from "@/lib/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const result = await query<{
    zakaznici: string;
    aktivni_projekty: string;
    nefakturovana_prace: string;
    sluzby_blizko_fakturace: string;
  }>(`
    SELECT
      (SELECT COUNT(*)::text FROM zakaznik WHERE stav = 'aktivni') AS zakaznici,
      (SELECT COUNT(*)::text FROM projekt WHERE stav = 'aktivni') AS aktivni_projekty,
      (SELECT COUNT(*)::text FROM odvedena_prace WHERE stav_fakturace = 'nefakturovano') AS nefakturovana_prace,
      (SELECT COUNT(*)::text FROM sluzba
        WHERE stav = 'aktivni'
          AND dalsi_fakturace IS NOT NULL
          AND dalsi_fakturace <= CURRENT_DATE + INTERVAL '30 days') AS sluzby_blizko_fakturace
  `);

  const row = result.rows[0];
  return {
    zakaznici: Number(row.zakaznici),
    aktivni_projekty: Number(row.aktivni_projekty),
    nefakturovana_prace: Number(row.nefakturovana_prace),
    sluzby_blizko_fakturace: Number(row.sluzby_blizko_fakturace),
  };
}
