"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { formOptStr, formStr } from "@/lib/form";
import {
  createPracovnik,
  deletePracovnik,
  updatePracovnik,
} from "@/lib/queries/pracovnik";

async function guard() {
  if (!(await requireSession())) redirect("/login");
}

function parse(formData: FormData) {
  return {
    jmeno: formStr(formData, "jmeno"),
    prijmeni: formStr(formData, "prijmeni"),
    email: formOptStr(formData, "email"),
    typ: formStr(formData, "typ") || "zamestnanec",
    naklad_na_hodinu: formOptStr(formData, "naklad_na_hodinu"),
    mena: formStr(formData, "mena") || "CZK",
    sazba_platna_od: formOptStr(formData, "sazba_platna_od"),
  };
}

export async function createPracovnikAction(formData: FormData) {
  await guard();
  await createPracovnik(parse(formData));
  revalidatePath("/pracovnici");
  redirect("/pracovnici");
}

export async function updatePracovnikAction(id: string, formData: FormData) {
  await guard();
  await updatePracovnik(id, parse(formData));
  revalidatePath("/pracovnici");
  redirect("/pracovnici");
}

export async function deletePracovnikAction(id: string) {
  await guard();
  await deletePracovnik(id);
  revalidatePath("/pracovnici");
  redirect("/pracovnici");
}
