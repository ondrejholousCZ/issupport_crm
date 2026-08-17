import { query } from "@/lib/db";
import { buildInvoiceDraftFromVykaz, type InvoiceDraft } from "@/lib/faktura-sablona";
import { resolvePartnerId } from "@/lib/idoklad/contacts";
import {
  buildIdokladInvoiceItem,
  createIssuedInvoice,
  idokladInvoiceUrl,
} from "@/lib/idoklad/invoices";
import { createFaktura, getFaktura } from "@/lib/queries/faktura";
import { replaceFakturaPolozky } from "@/lib/queries/faktura-polozka";
import { getSablonyForProjekty } from "@/lib/queries/fakturacni-sablona";
import { getVykaz, getVykazPolozky } from "@/lib/queries/vykaz-prace";
import { getZakaznik } from "@/lib/queries/zakaznik";

export async function prepareInvoiceDraftFromVykaz(vykazId: string): Promise<InvoiceDraft> {
  const vykaz = await getVykaz(vykazId);
  if (!vykaz) throw new Error("Výkaz neexistuje.");
  if (vykaz.stav !== "schvaleny") throw new Error("Fakturovat lze jen schválený výkaz.");
  if (vykaz.faktura_id) throw new Error("Výkaz už má vystavenou fakturu.");

  const polozky = await getVykazPolozky(vykazId);
  if (polozky.length === 0) throw new Error("Výkaz nemá položky.");

  const zakaznik = await getZakaznik(vykaz.zakaznik_id);
  if (!zakaznik) throw new Error("Zákazník neexistuje.");

  const projektIds = [...new Set(polozky.map((p) => p.projekt_id))];
  const sablony = await getSablonyForProjekty(projektIds);

  let partnerId: number | null = zakaznik.idoklad_partner_id;
  try {
    partnerId = await resolvePartnerId(zakaznik.ico, zakaznik.idoklad_partner_id);
    if (partnerId !== zakaznik.idoklad_partner_id) {
      await query(`UPDATE zakaznik SET idoklad_partner_id = $2 WHERE id = $1`, [
        zakaznik.id,
        partnerId,
      ]);
    }
  } catch {
    partnerId = zakaznik.idoklad_partner_id;
  }

  return buildInvoiceDraftFromVykaz({
    obdobi: vykaz.obdobi,
    polozky,
    sablony,
    partnerId,
    zakaznikId: vykaz.zakaznik_id,
  });
}

export async function issueVykazToIdoklad(
  vykazId: string,
  overrides?: Partial<{
    datum_vystaveni: string;
    datum_duzp: string;
    datum_splatnosti: string;
    polozky: Array<{ nazev: string; mnozstvi: number; jednotka: string; cena_jednotka: number }>;
  }>,
) {
  const vykaz = await getVykaz(vykazId);
  if (!vykaz) throw new Error("Výkaz neexistuje.");
  if (vykaz.faktura_id) throw new Error("Výkaz už má fakturu.");

  const draft = await prepareInvoiceDraftFromVykaz(vykazId);
  const zakaznik = await getZakaznik(vykaz.zakaznik_id);
  if (!zakaznik) throw new Error("Zákazník neexistuje.");

  const partnerId = await resolvePartnerId(zakaznik.ico, zakaznik.idoklad_partner_id);
  if (partnerId !== zakaznik.idoklad_partner_id) {
    await query(`UPDATE zakaznik SET idoklad_partner_id = $2 WHERE id = $1`, [zakaznik.id, partnerId]);
  }

  const datumVystaveni = overrides?.datum_vystaveni ?? draft.datumVystaveni;
  const datumDuzp = overrides?.datum_duzp ?? draft.datumDuzp;
  const datumSplatnosti = overrides?.datum_splatnosti ?? draft.datumSplatnosti;

  const lineInputs =
    overrides?.polozky?.map((p, i) => ({
      projektId: draft.polozky[i]?.projektId ?? draft.polozky[0]?.projektId ?? "",
      nazev: p.nazev,
      mnozstvi: p.mnozstvi,
      jednotka: p.jednotka,
      cenaJednotka: p.cena_jednotka,
      dphSazba: draft.polozky[i]?.dphSazba ?? draft.dphSazba,
      castkaBezDph: Math.round(p.mnozstvi * p.cena_jednotka * 100) / 100,
    })) ?? draft.polozky;

  const castkaBezDph = lineInputs.reduce((s, l) => s + l.castkaBezDph, 0);
  const castkaCelkem = Math.round(castkaBezDph * (1 + draft.dphSazba / 100) * 100) / 100;

  const idokladItems = lineInputs.map((l) =>
    buildIdokladInvoiceItem({
      nazev: l.nazev,
      mnozstvi: l.mnozstvi,
      jednotka: l.jednotka,
      cenaJednotka: l.cenaJednotka,
      dphSazba: l.dphSazba,
    }),
  );

  const issued = await createIssuedInvoice({
    partnerId,
    dateOfIssue: datumVystaveni,
    dateOfMaturity: datumSplatnosti,
    dateOfTaxing: datumDuzp,
    description: lineInputs.map((l) => l.nazev).join("; "),
    items: idokladItems,
  });

  const faktura = await createFaktura({
    cislo_faktury: issued.DocumentNumber,
    zakaznik_id: vykaz.zakaznik_id,
    projekt_id: draft.projektId ?? undefined,
    datum_vystaveni: datumVystaveni,
    datum_splatnosti: datumSplatnosti,
    datum_duzp: datumDuzp,
    castka_bez_dph: String(castkaBezDph),
    dph_sazba: String(draft.dphSazba),
    castka_celkem: String(castkaCelkem),
    stav: "vystavena",
    typ_faktury: "projektova",
    external_ref: String(issued.Id),
    vykaz_id: vykazId,
    idoklad_id: issued.Id,
    idoklad_url: idokladInvoiceUrl(issued.Id),
  });

  await replaceFakturaPolozky(
    faktura.id,
    lineInputs.map((l) => ({
      nazev: l.nazev,
      mnozstvi: l.mnozstvi,
      jednotka: l.jednotka,
      cena_jednotka: l.cenaJednotka,
      dph_sazba: l.dphSazba,
    })),
  );

  const praceIds = (await getVykazPolozky(vykazId)).map((p) => p.id);
  if (praceIds.length) {
    await query(
      `UPDATE odvedena_prace SET stav_fakturace = 'fakturovano', faktura_id = $2 WHERE id = ANY($1::uuid[])`,
      [praceIds, faktura.id],
    );
  }

  await query(`UPDATE vykaz_prace SET faktura_id = $2 WHERE id = $1`, [vykazId, faktura.id]);

  return getFaktura(faktura.id);
}

export async function syncIdokladInvoicePayment(fakturaId: string) {
  const faktura = await getFaktura(fakturaId);
  if (!faktura?.idoklad_id) return faktura;

  const { getIssuedInvoiceStatus, isIdokladPaid } = await import("@/lib/idoklad/invoices");
  const remote = await getIssuedInvoiceStatus(faktura.idoklad_id);
  if (!remote) return faktura;

  if (isIdokladPaid(remote) && faktura.stav !== "uhrazena") {
    await query(
      `UPDATE faktura SET stav = 'uhrazena', datum_uhrazeni = $2 WHERE id = $1`,
      [fakturaId, remote.DateOfPayment?.slice(0, 10) ?? null],
    );
    return getFaktura(fakturaId);
  }
  return faktura;
}

export async function syncAllIdokladPayments() {
  const result = await query<{ id: string }>(
    `SELECT id FROM faktura WHERE idoklad_id IS NOT NULL AND stav IN ('vystavena', 'po_splatnosti')`,
  );
  let updated = 0;
  for (const row of result.rows) {
    const before = await getFaktura(row.id);
    const after = await syncIdokladInvoicePayment(row.id);
    if (before?.stav !== after?.stav) updated++;
  }
  return updated;
}
