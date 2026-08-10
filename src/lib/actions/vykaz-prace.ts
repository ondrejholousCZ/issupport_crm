"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { formOptStr, formStr } from "@/lib/form";
import { isMesicObdobi } from "@/lib/prace-filters";
import { sendVykazApprovalEmail } from "@/lib/vykaz-email";
import {
  addPolozkyToVykaz,
  approveVykaz,
  createVykazWithPolozky,
  deleteVykaz,
  removePolozkaFromVykaz,
  sendVykaz,
  unlockVykaz,
} from "@/lib/queries/vykaz-prace";

async function guard() {
  if (!(await requireSession())) redirect("/login");
}

function parseIds(formData: FormData): string[] {
  return formData.getAll("ids").map(String).filter(Boolean);
}

function parseObdobi(formData: FormData): string {
  const obdobi = formStr(formData, "obdobi");
  if (!isMesicObdobi(obdobi)) {
    throw new Error("Výkaz lze vytvořit jen pro konkrétní měsíc (ne celý rok).");
  }
  return obdobi;
}

function redirectBack(formData: FormData, fallback: string) {
  const returnTo = formOptStr(formData, "returnTo");
  redirect(returnTo ? `/${fallback}?${returnTo}` : `/${fallback}`);
}

export async function createVykazFromPraceAction(formData: FormData) {
  await guard();
  const ids = parseIds(formData);
  const obdobi = parseObdobi(formData);
  await createVykazWithPolozky(obdobi, ids);
  revalidatePath("/prace");
  revalidatePath("/vykazy");
  redirectBack(formData, "prace");
}

export async function assignPraceToVykazAction(formData: FormData) {
  await guard();
  const ids = parseIds(formData);
  const vykazId = formStr(formData, "vykaz_id");
  await addPolozkyToVykaz(vykazId, ids);
  revalidatePath("/prace");
  revalidatePath("/vykazy");
  redirectBack(formData, "prace");
}

export async function sendVykazAction(vykazId: string, formData: FormData) {
  await guard();
  const toEmail = formOptStr(formData, "email");
  const { vykaz, polozky } = await sendVykaz(vykazId);

  const email = toEmail || vykaz.zakaznik_email;
  if (!email) {
    throw new Error("Zákazník nemá kontaktní e-mail. Vyplňte ho ve formuláři.");
  }

  await sendVykazApprovalEmail({
    vykaz,
    polozky,
    toEmail: email,
  });

  revalidatePath("/vykazy");
  revalidatePath("/prace");
  redirect("/vykazy");
}

export async function unlockVykazAction(vykazId: string) {
  await guard();
  await unlockVykaz(vykazId);
  revalidatePath("/vykazy");
  revalidatePath("/prace");
  redirect(`/vykazy?detail=${vykazId}`);
}

export async function removePolozkaFromVykazAction(vykazId: string, praceId: string) {
  await guard();
  await removePolozkaFromVykaz(vykazId, praceId);
  revalidatePath("/vykazy");
  revalidatePath("/prace");
  redirect(`/vykazy?detail=${vykazId}`);
}

export async function deleteVykazAction(vykazId: string) {
  await guard();
  await deleteVykaz(vykazId);
  revalidatePath("/vykazy");
  revalidatePath("/prace");
  redirect("/vykazy");
}

export async function approveVykazPublicAction(token: string, formData: FormData) {
  const poznamka = formOptStr(formData, "poznamka");
  await approveVykaz(token, poznamka);
  redirect(`/schvaleni/${token}?schvaleno=1`);
}
