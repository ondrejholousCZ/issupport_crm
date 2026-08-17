"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { formInt, formOptStr, formStr } from "@/lib/form";
import { createProjekt, deleteProjekt, updateProjekt } from "@/lib/queries/projekt";
import { upsertSablona } from "@/lib/queries/fakturacni-sablona";
import type { DuzpTyp, FakturacniJednotka } from "@/lib/types";

async function guard() {
  if (!(await requireSession())) redirect("/login");
}

function parse(formData: FormData) {
  return {
    nazev_projektu: formStr(formData, "nazev_projektu"),
    zakazka: formOptStr(formData, "zakazka"),
    zakaznik_id: formStr(formData, "zakaznik_id"),
    datum_od: formOptStr(formData, "datum_od"),
    datum_do: formOptStr(formData, "datum_do"),
    hodinova_sazba_fak: formOptStr(formData, "hodinova_sazba_fak"),
    jednotka_sazby: formStr(formData, "jednotka_sazby") || "hodina",
    mena: formStr(formData, "mena") || "CZK",
    stav: formStr(formData, "stav") || "aktivni",
  };
}

async function saveSablona(projektId: string, formData: FormData) {
  const text = formOptStr(formData, "faktura_text_sablona");
  if (!text) return;
  await upsertSablona({
    projekt_id: projektId,
    text_sablona: text,
    jednotka: (formStr(formData, "faktura_jednotka") || "md") as FakturacniJednotka,
    splatnost_dnu: formInt(formData, "faktura_splatnost_dnu", 30),
    duzp_typ: (formStr(formData, "faktura_duzp_typ") || "konec_obdobi") as DuzpTyp,
    dph_sazba: formStr(formData, "faktura_dph_sazba") || "21",
  });
}

export async function createProjektAction(formData: FormData) {
  await guard();
  const row = await createProjekt(parse(formData));
  await saveSablona(row.id, formData);
  revalidatePath("/projekty");
  redirect("/projekty");
}

export async function updateProjektAction(id: string, formData: FormData) {
  await guard();
  await updateProjekt(id, parse(formData));
  await saveSablona(id, formData);
  revalidatePath("/projekty");
  redirect("/projekty");
}

export async function deleteProjektAction(id: string) {
  await guard();
  await deleteProjekt(id);
  revalidatePath("/projekty");
  redirect("/projekty");
}
