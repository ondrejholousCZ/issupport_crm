"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { FREKVENCE_DNU } from "@/lib/labels";
import { formOptInt, formOptStr, formStr } from "@/lib/form";
import { createSluzba, deleteSluzba, updateSluzba } from "@/lib/queries/sluzba";
import type { SluzbaFrekvence } from "@/lib/types";

async function guard() {
  if (!(await requireSession())) redirect("/login");
}

function parse(formData: FormData) {
  const frekvence = formOptStr(formData, "frekvence") as SluzbaFrekvence | undefined;
  let frekvence_dnu = formOptInt(formData, "frekvence_dnu");
  if (frekvence && frekvence !== "vlastni") {
    frekvence_dnu = FREKVENCE_DNU[frekvence];
  }

  return {
    zakaznik_id: formStr(formData, "zakaznik_id"),
    nazev_sluzby: formStr(formData, "nazev_sluzby"),
    frekvence,
    frekvence_dnu,
    cena_periody: formOptStr(formData, "cena_periody"),
    mena: formStr(formData, "mena") || "CZK",
    posledni_platba: formOptStr(formData, "posledni_platba"),
    stav: formStr(formData, "stav") || "aktivni",
  };
}

export async function createSluzbaAction(formData: FormData) {
  await guard();
  await createSluzba(parse(formData));
  revalidatePath("/sluzby");
  redirect("/sluzby");
}

export async function updateSluzbaAction(id: string, formData: FormData) {
  await guard();
  await updateSluzba(id, parse(formData));
  revalidatePath("/sluzby");
  redirect("/sluzby");
}

export async function deleteSluzbaAction(id: string) {
  await guard();
  await deleteSluzba(id);
  revalidatePath("/sluzby");
  redirect("/sluzby");
}
