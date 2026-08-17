import type { FakturacniJednotka, FakturacniSablona, OdvedenaPrace } from "@/lib/types";
import { billingUnits } from "@/lib/work-hours";

export type InvoiceDraftLine = {
  projektId: string;
  nazev: string;
  mnozstvi: number;
  jednotka: string;
  cenaJednotka: number;
  dphSazba: number;
  castkaBezDph: number;
};

export type InvoiceDraft = {
  zakaznikId: string;
  projektId: string | null;
  obdobi: string;
  datumVystaveni: string;
  datumDuzp: string;
  datumSplatnosti: string;
  partnerId: number | null;
  polozky: InvoiceDraftLine[];
  castkaBezDph: number;
  dphSazba: number;
  castkaCelkem: number;
};

const DEFAULT_SABLONA: Omit<FakturacniSablona, "id" | "projekt_id" | "created_at" | "updated_at"> = {
  text_sablona: "{zakazka} - Servisní práce za {mesic}/{rok}",
  jednotka: "md",
  splatnost_dnu: 30,
  duzp_typ: "konec_obdobi",
  dph_sazba: "21",
};

export function defaultSablonaForProjekt(projektId: string): FakturacniSablona {
  return {
    id: "",
    projekt_id: projektId,
    ...DEFAULT_SABLONA,
    created_at: "",
    updated_at: "",
  };
}

export function renderSablonaText(
  sablona: string,
  vars: { zakazka: string; mesic: string; rok: string; obdobi: string },
): string {
  return sablona
    .replaceAll("{zakazka}", vars.zakazka)
    .replaceAll("{mesic}", vars.mesic)
    .replaceAll("{rok}", vars.rok)
    .replaceAll("{obdobi}", vars.obdobi);
}

function obdobiParts(obdobi: string): { mesic: string; rok: string } {
  const [rok, mesicNum] = obdobi.split("-");
  return { rok, mesic: mesicNum ?? "" };
}

function lastDayOfObdobi(obdobi: string): string {
  const [rokStr, mesicStr] = obdobi.split("-");
  const rok = Number(rokStr);
  const mesic = Number(mesicStr);
  const d = new Date(rok, mesic, 0);
  return toIsoDate(d);
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function computeInvoiceDates(obdobi: string, sablona: Pick<FakturacniSablona, "splatnost_dnu" | "duzp_typ">) {
  const today = toIsoDate(new Date());
  const duzp = sablona.duzp_typ === "konec_obdobi" ? lastDayOfObdobi(obdobi) : today;
  const datumVystaveni = today;
  const datumSplatnosti = addDays(duzp, sablona.splatnost_dnu);
  return { datumVystaveni, datumDuzp: duzp, datumSplatnosti };
}

function jednotkaLabel(jednotka: FakturacniJednotka): string {
  if (jednotka === "md") return "MD";
  if (jednotka === "hodina") return "hod";
  return "ks";
}

function quantityForRows(rows: OdvedenaPrace[], jednotka: FakturacniJednotka): number {
  if (jednotka === "ks") return 1;
  let total = 0;
  for (const row of rows) {
    const projJednotka = row.projekt_jednotka_sazby ?? "hodina";
    const unit = jednotka === "md" ? "md" : projJednotka;
    total += billingUnits(row.hodiny, row.minuty, unit);
  }
  return Math.round(total * 100) / 100;
}

export function buildInvoiceDraftFromVykaz(input: {
  obdobi: string;
  polozky: OdvedenaPrace[];
  sablony: Map<string, FakturacniSablona>;
  partnerId: number | null;
  zakaznikId: string;
}): InvoiceDraft {
  const byProject = new Map<string, OdvedenaPrace[]>();
  for (const row of input.polozky) {
    const list = byProject.get(row.projekt_id) ?? [];
    list.push(row);
    byProject.set(row.projekt_id, list);
  }

  const lines: InvoiceDraftLine[] = [];
  let primaryProjektId: string | null = null;

  for (const [projektId, rows] of byProject) {
    primaryProjektId ??= projektId;
    const sample = rows[0];
    const sablona = input.sablony.get(projektId) ?? defaultSablonaForProjekt(projektId);
    const parts = obdobiParts(input.obdobi);
    const zakazka = sample.projekt_zakazka ?? sample.projekt_nazev ?? "Projekt";
    const nazev = renderSablonaText(sablona.text_sablona, {
      zakazka,
      mesic: parts.mesic.padStart(2, "0"),
      rok: parts.rok,
      obdobi: input.obdobi,
    });

    const mnozstvi = quantityForRows(rows, sablona.jednotka);
    const cenaJednotka = Number(sample.projekt_sazba_fak ?? 0);
    const dphSazba = Number(sablona.dph_sazba);
    const castkaBezDph = Math.round(mnozstvi * cenaJednotka * 100) / 100;

    lines.push({
      projektId,
      nazev,
      mnozstvi,
      jednotka: jednotkaLabel(sablona.jednotka),
      cenaJednotka,
      dphSazba,
      castkaBezDph,
    });
  }

  const firstSablona =
    input.sablony.get(lines[0]?.projektId ?? "") ?? defaultSablonaForProjekt(lines[0]?.projektId ?? "");
  const dates = computeInvoiceDates(input.obdobi, firstSablona);
  const castkaBezDph = lines.reduce((s, l) => s + l.castkaBezDph, 0);
  const dphSazba = Number(firstSablona.dph_sazba);
  const castkaCelkem = Math.round(castkaBezDph * (1 + dphSazba / 100) * 100) / 100;

  return {
    zakaznikId: input.zakaznikId,
    projektId: lines.length === 1 ? primaryProjektId : null,
    obdobi: input.obdobi,
    partnerId: input.partnerId,
    polozky: lines,
    castkaBezDph,
    dphSazba,
    castkaCelkem,
    ...dates,
  };
}
