"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { formOptStr, formStr } from "@/lib/form";
import { createProjekt, deleteProjekt, updateProjekt } from "@/lib/queries/projekt";

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
    mena: formStr(formData, "mena") || "CZK",
    stav: formStr(formData, "stav") || "aktivni",
  };
}

export async function createProjektAction(formData: FormData) {
  await guard();
  await createProjekt(parse(formData));
  revalidatePath("/projekty");
  redirect("/projekty");
}

export async function updateProjektAction(id: string, formData: FormData) {
  await guard();
  await updateProjekt(id, parse(formData));
  revalidatePath("/projekty");
  redirect("/projekty");
}

export async function deleteProjektAction(id: string) {
  await guard();
  await deleteProjekt(id);
  revalidatePath("/projekty");
  redirect("/projekty");
}
