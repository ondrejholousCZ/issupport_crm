"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { sendFakturaEmail } from "@/lib/faktura-email";
import { formOptStr, formStr } from "@/lib/form";
import {
  createFaktura,
  deleteFaktura,
  getFaktura,
  markFakturaSent,
  updateFaktura,
} from "@/lib/queries/faktura";
import { getVykaz } from "@/lib/queries/vykaz-prace";
import { getZakaznik } from "@/lib/queries/zakaznik";

async function guard() {
  if (!(await requireSession())) redirect("/login");
}

export async function sendFakturaEmailAction(fakturaId: string, formData: FormData) {
  await guard();

  const faktura = await getFaktura(fakturaId);
  if (!faktura) throw new Error("Faktura neexistuje.");

  const zakaznik = await getZakaznik(faktura.zakaznik_id);
  if (!zakaznik) throw new Error("Zákazník neexistuje.");

  const toEmail =
    formOptStr(formData, "email") || zakaznik.fakturacni_email || zakaznik.kontaktni_email;
  if (!toEmail) {
    throw new Error("Zákazník nemá fakturační e-mail. Vyplňte ho ve formuláři.");
  }

  let obdobi: string | null = null;
  if (faktura.vykaz_id) {
    const vykaz = await getVykaz(faktura.vykaz_id);
    obdobi = vykaz?.obdobi ?? null;
  }

  await sendFakturaEmail({
    faktura,
    toEmail,
    zakaznikNazev: zakaznik.nazev,
    obdobi,
  });

  await markFakturaSent(fakturaId, toEmail);

  revalidatePath("/faktury");
  revalidatePath("/vykazy");
  const returnTo = formOptStr(formData, "returnTo");
  redirect(returnTo || `/faktury?upravit=${fakturaId}`);
}

function parse(formData: FormData) {
  return {
    cislo_faktury: formOptStr(formData, "cislo_faktury"),
    zakaznik_id: formStr(formData, "zakaznik_id"),
    projekt_id: formOptStr(formData, "projekt_id"),
    sluzba_id: formOptStr(formData, "sluzba_id"),
    datum_vystaveni: formOptStr(formData, "datum_vystaveni"),
    datum_splatnosti: formOptStr(formData, "datum_splatnosti"),
    datum_uhrazeni: formOptStr(formData, "datum_uhrazeni"),
    castka_bez_dph: formOptStr(formData, "castka_bez_dph"),
    dph_sazba: formOptStr(formData, "dph_sazba") ?? "21",
    castka_celkem: formOptStr(formData, "castka_celkem"),
    stav: formStr(formData, "stav") || "rozpracovana",
    typ_faktury: formOptStr(formData, "typ_faktury"),
    external_ref: formOptStr(formData, "external_ref"),
  };
}

export async function createFakturaAction(formData: FormData) {
  await guard();
  await createFaktura(parse(formData));
  revalidatePath("/faktury");
  revalidatePath("/faktury/timeline");
  redirect("/faktury");
}

export async function updateFakturaAction(id: string, formData: FormData) {
  await guard();
  await updateFaktura(id, parse(formData));
  revalidatePath("/faktury");
  revalidatePath("/faktury/timeline");
  redirect("/faktury");
}

export async function deleteFakturaAction(id: string) {
  await guard();
  await deleteFaktura(id);
  revalidatePath("/faktury");
  revalidatePath("/faktury/timeline");
  redirect("/faktury");
}
