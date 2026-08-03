"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { parseCas } from "@/lib/cas";
import { formInt, formOptStr, formStr } from "@/lib/form";
import { createPrace, deletePrace, deletePraceBulk, updatePrace } from "@/lib/queries/prace";

async function guard() {
  if (!(await requireSession())) redirect("/login");
}

function parseDates(formData: FormData): string[] {
  const multi = formStr(formData, "datums");
  if (multi) {
    return [...new Set(multi.split(",").map((d) => d.trim()).filter(Boolean))].sort();
  }
  const single = formStr(formData, "datum");
  return single ? [single] : [];
}

function parse(formData: FormData) {
  const casRaw = formStr(formData, "cas");
  const fromCas = casRaw ? parseCas(casRaw) : null;

  return {
    hodiny: fromCas?.hodiny ?? formInt(formData, "hodiny"),
    minuty: fromCas?.minuty ?? formInt(formData, "minuty"),
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
  const datums = parseDates(formData);
  if (datums.length === 0) redirect("/prace?nova=1");

  const base = parse(formData);
  base.zakaznik_id = await resolveZakaznikId(base);

  if (datums.length === 1) {
    const row = await createPrace({ ...base, datum: datums[0] });
    revalidatePath("/prace");
    redirect(`/prace/${row.id}`);
  }

  for (const datum of datums) {
    await createPrace({ ...base, datum });
  }
  revalidatePath("/prace");
  redirect("/prace");
}

export async function updatePraceAction(id: string, formData: FormData) {
  await guard();
  const casRaw = formStr(formData, "cas");
  const fromCas = casRaw ? parseCas(casRaw) : null;
  const parsed = {
    ...parse(formData),
    datum: formStr(formData, "datum"),
    hodiny: fromCas?.hodiny ?? formInt(formData, "hodiny"),
    minuty: fromCas?.minuty ?? formInt(formData, "minuty"),
  };
  await updatePrace(id, parsed);
  revalidatePath("/prace");
  redirect("/prace");
}

export async function deletePraceAction(id: string) {
  await guard();
  await deletePrace(id);
  revalidatePath("/prace");
  redirect("/prace");
}

export async function deletePraceBulkAction(formData: FormData) {
  await guard();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  if (ids.length === 0) redirect("/prace");
  await deletePraceBulk(ids);
  revalidatePath("/prace");
  redirect("/prace");
}
