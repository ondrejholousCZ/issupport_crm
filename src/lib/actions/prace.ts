"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { formInt, formOptStr, formStr } from "@/lib/form";
import { createPrace, deletePrace, updatePrace } from "@/lib/queries/prace";

async function guard() {
  if (!(await requireSession())) redirect("/login");
}

function parse(formData: FormData) {
  return {
    datum: formStr(formData, "datum"),
    hodiny: formInt(formData, "hodiny"),
    minuty: formInt(formData, "minuty"),
    druh_cinnosti: formOptStr(formData, "druh_cinnosti"),
    zakaznik_id: formStr(formData, "zakaznik_id"),
    projekt_id: formStr(formData, "projekt_id"),
    pracovnik_id: formStr(formData, "pracovnik_id"),
    popis: formOptStr(formData, "popis"),
    stav_fakturace: formStr(formData, "stav_fakturace") || "nefakturovano",
    faktura_id: formOptStr(formData, "faktura_id"),
  };
}

async function resolveZakaznikId(data: ReturnType<typeof parse>) {
  if (data.zakaznik_id) return data.zakaznik_id;
  const { getProjekt } = await import("@/lib/queries/projekt");
  const projekt = await getProjekt(data.projekt_id);
  return projekt?.zakaznik_id ?? data.zakaznik_id;
}

export async function createPraceAction(formData: FormData) {
  await guard();
  const parsed = parse(formData);
  parsed.zakaznik_id = await resolveZakaznikId(parsed);
  const row = await createPrace(parsed);
  revalidatePath("/prace");
  redirect(`/prace/${row.id}`);
}

export async function updatePraceAction(id: string, formData: FormData) {
  await guard();
  await updatePrace(id, parse(formData));
  revalidatePath("/prace");
  redirect(`/prace/${id}`);
}

export async function deletePraceAction(id: string) {
  await guard();
  await deletePrace(id);
  revalidatePath("/prace");
  redirect("/prace");
}
