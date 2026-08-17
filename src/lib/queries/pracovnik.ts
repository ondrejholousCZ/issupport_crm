import { query } from "@/lib/db";
import type { Pracovnik } from "@/lib/types";

export async function listPracovnici(): Promise<Pracovnik[]> {
  const result = await query<Pracovnik>(
    `SELECT * FROM pracovnik ORDER BY prijmeni, jmeno`,
  );
  return result.rows;
}

export async function getPracovnik(id: string): Promise<Pracovnik | null> {
  const result = await query<Pracovnik>(`SELECT * FROM pracovnik WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function createPracovnik(data: {
  jmeno: string;
  prijmeni: string;
  email?: string;
  typ: string;
  naklad_na_hodinu?: string;
  mena: string;
  sazba_platna_od?: string;
}) {
  const result = await query<Pracovnik>(
    `INSERT INTO pracovnik (jmeno, prijmeni, email, typ, naklad_na_hodinu, mena, sazba_platna_od)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      data.jmeno,
      data.prijmeni,
      data.email || null,
      data.typ,
      data.naklad_na_hodinu || null,
      data.mena,
      data.sazba_platna_od || null,
    ],
  );
  return result.rows[0];
}

export async function updatePracovnik(
  id: string,
  data: {
    jmeno: string;
    prijmeni: string;
    email?: string;
    typ: string;
    naklad_na_hodinu?: string;
    mena: string;
    sazba_platna_od?: string;
  },
) {
  const result = await query<Pracovnik>(
    `UPDATE pracovnik SET
      jmeno = $2, prijmeni = $3, email = $4, typ = $5,
      naklad_na_hodinu = $6, mena = $7, sazba_platna_od = $8
     WHERE id = $1 RETURNING *`,
    [
      id,
      data.jmeno,
      data.prijmeni,
      data.email || null,
      data.typ,
      data.naklad_na_hodinu || null,
      data.mena,
      data.sazba_platna_od || null,
    ],
  );
  return result.rows[0];
}

export async function deletePracovnik(id: string) {
  await query(`DELETE FROM pracovnik WHERE id = $1`, [id]);
}

export async function listPracovnikOptions() {
  const result = await query<{ id: string; label: string }>(
    `SELECT id, CONCAT(prijmeni, ' ', jmeno) AS label FROM pracovnik ORDER BY prijmeni, jmeno`,
  );
  return result.rows;
}

export async function getPracovnikIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const result = await query<{ id: string }>(
    `SELECT id FROM pracovnik WHERE lower(email) = $1 LIMIT 1`,
    [normalized],
  );
  return result.rows[0]?.id ?? null;
}
