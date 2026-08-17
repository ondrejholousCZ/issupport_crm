"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { formInt, formOptStr, formStr } from "@/lib/form";
import { issueVykazToIdoklad } from "@/lib/queries/faktura-from-vykaz";

async function guard() {
  if (!(await requireSession())) redirect("/login");
}

export async function issueVykazToIdokladAction(vykazId: string, formData: FormData) {
  await guard();

  const polozkyCount = Number(formData.get("polozky_count") ?? 0);
  const polozky = [];
  for (let i = 0; i < polozkyCount; i++) {
    const nazev = formOptStr(formData, `polozka_${i}_nazev`);
    if (!nazev) continue;
    polozky.push({
      nazev,
      mnozstvi: formInt(formData, `polozka_${i}_mnozstvi`),
      jednotka: formStr(formData, `polozka_${i}_jednotka`) || "MD",
      cena_jednotka: formInt(formData, `polozka_${i}_cena`),
    });
  }

  await issueVykazToIdoklad(vykazId, {
    datum_vystaveni: formOptStr(formData, "datum_vystaveni"),
    datum_duzp: formOptStr(formData, "datum_duzp"),
    datum_splatnosti: formOptStr(formData, "datum_splatnosti"),
    polozky: polozky.length ? polozky : undefined,
  });

  revalidatePath("/vykazy");
  revalidatePath("/faktury");
  revalidatePath("/prace");
  revalidatePath("/faktury/timeline");
  redirect(`/vykazy?detail=${vykazId}`);
}
