"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { formOptStr, formStr } from "@/lib/form";
import {
  createZakaznik,
  deleteZakaznik,
  updateZakaznik,
} from "@/lib/queries/zakaznik";

async function guard() {
  if (!(await requireSession())) redirect("/login");
}

function parse(formData: FormData) {
  return {
    ico: formOptStr(formData, "ico"),
    nazev: formStr(formData, "nazev"),
    ic_dph: formOptStr(formData, "ic_dph"),
    kontaktni_email: formOptStr(formData, "kontaktni_email"),
    kontaktni_telefon: formOptStr(formData, "kontaktni_telefon"),
    fakturacni_ulice: formOptStr(formData, "fakturacni_ulice"),
    fakturacni_mesto: formOptStr(formData, "fakturacni_mesto"),
    fakturacni_psc: formOptStr(formData, "fakturacni_psc"),
    postup_fakturace: formOptStr(formData, "postup_fakturace"),
    stav: formStr(formData, "stav") || "aktivni",
  };
}

export async function createZakaznikAction(formData: FormData) {
  await guard();
  const data = parse(formData);
  if (!data.nazev) return;
  const row = await createZakaznik(data);
  revalidatePath("/zakaznici");
  redirect(`/zakaznici/${row.id}`);
}

export async function updateZakaznikAction(id: string, formData: FormData) {
  await guard();
  const data = parse(formData);
  if (!data.nazev) return;
  await updateZakaznik(id, data);
  revalidatePath("/zakaznici");
  revalidatePath(`/zakaznici/${id}`);
  redirect(`/zakaznici/${id}`);
}

export async function deleteZakaznikAction(id: string) {
  await guard();
  await deleteZakaznik(id);
  revalidatePath("/zakaznici");
  redirect("/zakaznici");
}
