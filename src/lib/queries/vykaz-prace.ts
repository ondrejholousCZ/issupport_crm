import { randomBytes } from "crypto";
import { query } from "@/lib/db";
import type { OdvedenaPrace, VykazPrace } from "@/lib/types";

export type VykazPraceRow = VykazPrace & {
  zakaznik_nazev?: string;
  pocet_polozek?: number;
  celkem_hodiny?: string;
  celkem_castka?: string;
};

function newToken(): string {
  return randomBytes(32).toString("hex");
}

const POLOZKA_SELECT = `
  SELECT op.*,
         z.nazev AS zakaznik_nazev,
         z.zkratka AS zakaznik_zkratka,
         p.nazev_projektu AS projekt_nazev,
         p.zakazka AS projekt_zakazka,
         p.hodinova_sazba_fak AS projekt_sazba_fak,
         p.jednotka_sazby AS projekt_jednotka_sazby,
         pr.jmeno AS pracovnik_jmeno_krestni,
         pr.prijmeni AS pracovnik_prijmeni,
         CONCAT(pr.prijmeni, ' ', pr.jmeno) AS pracovnik_jmeno
  FROM vykaz_prace_polozka vpp
  JOIN odvedena_prace op ON op.id = vpp.odvedena_prace_id
  JOIN zakaznik z ON z.id = op.zakaznik_id
  JOIN projekt p ON p.id = op.projekt_id
  JOIN pracovnik pr ON pr.id = op.pracovnik_id
`;

export async function listVykazy(filters?: { obdobi?: string; zakaznikId?: string }): Promise<VykazPraceRow[]> {
  const clauses: string[] = [];
  const params: string[] = [];

  if (filters?.obdobi) {
    params.push(filters.obdobi);
    clauses.push(`v.obdobi = $${params.length}`);
  }
  if (filters?.zakaznikId) {
    params.push(filters.zakaznikId);
    clauses.push(`v.zakaznik_id = $${params.length}::uuid`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await query<VykazPraceRow>(
    `SELECT v.*,
            z.nazev AS zakaznik_nazev,
            COUNT(vpp.odvedena_prace_id)::int AS pocet_polozek
     FROM vykaz_prace v
     JOIN zakaznik z ON z.id = v.zakaznik_id
     LEFT JOIN vykaz_prace_polozka vpp ON vpp.vykaz_id = v.id
     ${where}
     GROUP BY v.id, z.nazev
     ORDER BY v.obdobi DESC, v.created_at DESC`,
    params.length ? params : undefined,
  );
  return result.rows;
}

export async function listRozpracovaneVykazy(zakaznikId?: string): Promise<VykazPraceRow[]> {
  const result = await query<VykazPraceRow>(
    zakaznikId
      ? `SELECT v.*, z.nazev AS zakaznik_nazev
         FROM vykaz_prace v
         JOIN zakaznik z ON z.id = v.zakaznik_id
         WHERE v.stav = 'rozpracovany' AND v.zakaznik_id = $1
         ORDER BY v.created_at DESC`
      : `SELECT v.*, z.nazev AS zakaznik_nazev
         FROM vykaz_prace v
         JOIN zakaznik z ON z.id = v.zakaznik_id
         WHERE v.stav = 'rozpracovany'
         ORDER BY v.created_at DESC`,
    zakaznikId ? [zakaznikId] : undefined,
  );
  return result.rows;
}

export async function getVykaz(id: string): Promise<VykazPrace | null> {
  const result = await query<VykazPrace>(
    `SELECT v.*, z.nazev AS zakaznik_nazev, z.kontaktni_email AS zakaznik_email
     FROM vykaz_prace v
     JOIN zakaznik z ON z.id = v.zakaznik_id
     WHERE v.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function getVykazByToken(token: string): Promise<VykazPrace | null> {
  const result = await query<VykazPrace>(
    `SELECT v.*, z.nazev AS zakaznik_nazev
     FROM vykaz_prace v
     JOIN zakaznik z ON z.id = v.zakaznik_id
     WHERE v.approval_token = $1`,
    [token],
  );
  return result.rows[0] ?? null;
}

export async function getVykazPolozky(vykazId: string): Promise<OdvedenaPrace[]> {
  const result = await query<OdvedenaPrace>(
    `${POLOZKA_SELECT}
     WHERE vpp.vykaz_id = $1
     ORDER BY op.datum, op.created_at`,
    [vykazId],
  );
  return result.rows;
}

export async function getVykazPolozkyByToken(token: string): Promise<OdvedenaPrace[]> {
  const result = await query<OdvedenaPrace>(
    `${POLOZKA_SELECT}
     JOIN vykaz_prace v ON v.id = vpp.vykaz_id
     WHERE v.approval_token = $1
     ORDER BY op.datum, op.created_at`,
    [token],
  );
  return result.rows;
}

export async function getPraceVykazMap(praceIds: string[]): Promise<Map<string, string>> {
  if (praceIds.length === 0) return new Map();
  const result = await query<{ odvedena_prace_id: string; vykaz_id: string }>(
    `SELECT odvedena_prace_id, vykaz_id FROM vykaz_prace_polozka WHERE odvedena_prace_id = ANY($1::uuid[])`,
    [praceIds],
  );
  return new Map(result.rows.map((r) => [r.odvedena_prace_id, r.vykaz_id]));
}

async function assertPraceAvailable(ids: string[], excludeVykazId?: string) {
  if (ids.length === 0) throw new Error("Nejsou vybrány žádné záznamy.");
  const result = await query<{ id: string; zakaznik_id: string; stav_fakturace: string; vykaz_id: string | null; vykaz_stav: string | null }>(
    `SELECT op.id, op.zakaznik_id, op.stav_fakturace,
            vpp.vykaz_id, vp.stav AS vykaz_stav
     FROM odvedena_prace op
     LEFT JOIN vykaz_prace_polozka vpp ON vpp.odvedena_prace_id = op.id
     LEFT JOIN vykaz_prace vp ON vp.id = vpp.vykaz_id
     WHERE op.id = ANY($1::uuid[])`,
    [ids],
  );
  if (result.rows.length !== ids.length) throw new Error("Některé záznamy neexistují.");
  const zakaznici = new Set(result.rows.map((r) => r.zakaznik_id));
  if (zakaznici.size > 1) throw new Error("Vybraná práce patří různým zákazníkům.");

  for (const row of result.rows) {
    if (row.stav_fakturace === "fakturovano") {
      throw new Error("Fakturovanou práci nelze přidat do výkazu.");
    }
    if (row.vykaz_id && row.vykaz_id !== excludeVykazId) {
      throw new Error("Některá práce je už v jiném výkazu.");
    }
  }
  return { zakaznikId: result.rows[0].zakaznik_id };
}

export async function createVykazWithPolozky(obdobi: string, praceIds: string[]) {
  const { zakaznikId } = await assertPraceAvailable(praceIds);
  const vykaz = await query<VykazPrace>(
    `INSERT INTO vykaz_prace (zakaznik_id, obdobi) VALUES ($1, $2) RETURNING *`,
    [zakaznikId, obdobi],
  );
  const vykazId = vykaz.rows[0].id;
  for (const praceId of praceIds) {
    await query(
      `INSERT INTO vykaz_prace_polozka (vykaz_id, odvedena_prace_id) VALUES ($1, $2)`,
      [vykazId, praceId],
    );
  }
  return vykaz.rows[0];
}

export async function addPolozkyToVykaz(vykazId: string, praceIds: string[]) {
  const vykaz = await getVykaz(vykazId);
  if (!vykaz) throw new Error("Výkaz neexistuje.");
  if (vykaz.stav !== "rozpracovany") throw new Error("Upravit lze jen rozpracovaný výkaz.");

  const { zakaznikId } = await assertPraceAvailable(praceIds, vykazId);
  if (zakaznikId !== vykaz.zakaznik_id) {
    throw new Error("Práce musí patřit stejnému zákazníkovi jako výkaz.");
  }

  for (const praceId of praceIds) {
    await query(
      `INSERT INTO vykaz_prace_polozka (vykaz_id, odvedena_prace_id) VALUES ($1, $2)
       ON CONFLICT (odvedena_prace_id) DO NOTHING`,
      [vykazId, praceId],
    );
  }
}

export async function sendVykaz(vykazId: string) {
  const vykaz = await getVykaz(vykazId);
  if (!vykaz) throw new Error("Výkaz neexistuje.");
  if (vykaz.stav !== "rozpracovany") throw new Error("Odeslat lze jen rozpracovaný výkaz.");

  const polozky = await getVykazPolozky(vykazId);
  if (polozky.length === 0) throw new Error("Výkaz nemá žádné položky.");

  const token = newToken();
  await query(
    `UPDATE vykaz_prace SET
       stav = 'odeslany',
       odeslano_at = now(),
       approval_token = $2,
       poznamka_klienta = NULL,
       schvaleno_at = NULL
     WHERE id = $1`,
    [vykazId, token],
  );

  const ids = polozky.map((p) => p.id);
  await query(
    `UPDATE odvedena_prace SET stav_fakturace = 'schvaleni_vykazu' WHERE id = ANY($1::uuid[])`,
    [ids],
  );

  const updated = await getVykaz(vykazId);
  if (!updated) throw new Error("Výkaz neexistuje.");

  return { token, vykaz: updated, polozky };
}

export async function approveVykaz(token: string, poznamka?: string) {
  const vykaz = await getVykazByToken(token);
  if (!vykaz) throw new Error("Výkaz nenalezen.");
  if (vykaz.stav === "schvaleny") throw new Error("Výkaz je už schválený.");
  if (vykaz.stav !== "odeslany") throw new Error("Tento výkaz nelze schválit.");

  await query(
    `UPDATE vykaz_prace SET stav = 'schvaleny', schvaleno_at = now(), poznamka_klienta = $2 WHERE id = $1`,
    [vykaz.id, poznamka?.trim() || null],
  );

  const polozky = await getVykazPolozky(vykaz.id);
  const ids = polozky.map((p) => p.id);
  if (ids.length) {
    await query(
      `UPDATE odvedena_prace SET stav_fakturace = 'nefakturovano' WHERE id = ANY($1::uuid[])`,
      [ids],
    );
  }
}

export async function unlockVykaz(vykazId: string) {
  const vykaz = await getVykaz(vykazId);
  if (!vykaz) throw new Error("Výkaz neexistuje.");
  if (vykaz.stav === "rozpracovany") return;

  const polozky = await getVykazPolozky(vykazId);
  const ids = polozky.map((p) => p.id);

  await query(
    `UPDATE vykaz_prace SET
       stav = 'rozpracovany',
       odeslano_at = NULL,
       schvaleno_at = NULL,
       poznamka_klienta = NULL,
       approval_token = NULL
     WHERE id = $1`,
    [vykazId],
  );

  if (ids.length) {
    await query(
      `UPDATE odvedena_prace SET stav_fakturace = 'nefakturovano'
       WHERE id = ANY($1::uuid[]) AND stav_fakturace = 'schvaleni_vykazu'`,
      [ids],
    );
  }
}

export async function removePolozkaFromVykaz(vykazId: string, praceId: string) {
  const vykaz = await getVykaz(vykazId);
  if (!vykaz || vykaz.stav !== "rozpracovany") {
    throw new Error("Položku lze odebrat jen z rozpracovaného výkazu.");
  }
  await query(
    `DELETE FROM vykaz_prace_polozka WHERE vykaz_id = $1 AND odvedena_prace_id = $2`,
    [vykazId, praceId],
  );
  await query(
    `UPDATE odvedena_prace SET stav_fakturace = 'nefakturovano'
     WHERE id = $1 AND stav_fakturace = 'schvaleni_vykazu'`,
    [praceId],
  );
}

export async function deleteVykaz(vykazId: string) {
  const vykaz = await getVykaz(vykazId);
  if (!vykaz) throw new Error("Výkaz neexistuje.");
  if (vykaz.stav !== "rozpracovany") {
    throw new Error("Smazat lze jen rozpracovaný výkaz. Nejdříve ho odemkněte.");
  }

  const polozky = await getVykazPolozky(vykazId);
  const ids = polozky.map((p) => p.id);

  await query(`DELETE FROM vykaz_prace WHERE id = $1`, [vykazId]);

  if (ids.length) {
    await query(
      `UPDATE odvedena_prace SET stav_fakturace = 'nefakturovano'
       WHERE id = ANY($1::uuid[]) AND stav_fakturace = 'schvaleni_vykazu'`,
      [ids],
    );
  }
}
