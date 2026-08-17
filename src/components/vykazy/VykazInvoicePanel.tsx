"use client";

import Link from "next/link";
import { normalizeIdokladInvoiceUrl } from "@/lib/idoklad/invoices";
import { issueVykazToIdokladAction } from "@/lib/actions/faktura-vykaz";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormField } from "@/components/ui/FormField";
import { formatMoney } from "@/lib/format";
import type { Faktura } from "@/lib/types";
import type { InvoiceDraft } from "@/lib/faktura-sablona";

export function VykazInvoicePanel({
  vykazId,
  draft,
  faktura,
}: {
  vykazId: string;
  draft: InvoiceDraft | null;
  faktura: Faktura | null;
}) {
  if (faktura) {
    const idokladUrl = normalizeIdokladInvoiceUrl(faktura.idoklad_url, faktura.idoklad_id);
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2 text-sm">
        <p className="font-medium text-green-800">Faktura vystavena</p>
        <p>
          Číslo: <strong>{faktura.cislo_faktury ?? "—"}</strong>
          {" · "}
          {formatMoney(faktura.castka_celkem)}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/faktury?upravit=${faktura.id}`} className="text-primary hover:underline">
            Detail v CRM
          </Link>
          {idokladUrl ? (
            <a href={idokladUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Otevřít v iDokladu
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  if (!draft) return null;

  const action = issueVykazToIdokladAction.bind(null, vykazId);

  return (
    <form action={action} className="space-y-4 border-t border-border pt-4">
      <div>
        <h3 className="text-sm font-semibold">Vystavit fakturu v iDokladu</h3>
        <p className="text-xs text-gray-500 mt-1">
          Návrh z fakturační šablony projektu. Po vystavení se propojí práce, výkaz a faktura.
        </p>
      </div>

      <input type="hidden" name="polozky_count" value={draft.polozky.length} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Datum vystavení" name="datum_vystaveni" type="date" defaultValue={draft.datumVystaveni} />
        <FormField label="DUZP" name="datum_duzp" type="date" defaultValue={draft.datumDuzp} />
        <FormField label="Splatnost" name="datum_splatnosti" type="date" defaultValue={draft.datumSplatnosti} />
      </div>

      <div className="space-y-3">
        {draft.polozky.map((p, i) => (
          <div key={p.projektId} className="rounded-lg border border-border p-3 space-y-2 bg-gray-50/50">
            <FormField label={`Položka ${i + 1}`} name={`polozka_${i}_nazev`} defaultValue={p.nazev} />
            <div className="grid grid-cols-3 gap-2">
              <FormField label="Množství" name={`polozka_${i}_mnozstvi`} type="number" step="0.01" defaultValue={String(p.mnozstvi)} />
              <FormField label="Jednotka" name={`polozka_${i}_jednotka`} defaultValue={p.jednotka} />
              <FormField label="Cena / jednotku" name={`polozka_${i}_cena`} type="number" step="0.01" defaultValue={String(p.cenaJednotka)} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <span>
          Celkem bez DPH: <strong>{formatMoney(draft.castkaBezDph)}</strong>
        </span>
        <span>
          Celkem s DPH: <strong>{formatMoney(draft.castkaCelkem)}</strong>
        </span>
        {draft.partnerId ? (
          <span>
            iDoklad partner: <strong>{draft.partnerId}</strong>
          </span>
        ) : (
          <span className="text-amber-700">Partner v iDokladu se dohledá podle IČO při vystavení.</span>
        )}
      </div>

      <SubmitButton>Vystavit fakturu v iDokladu</SubmitButton>
    </form>
  );
}
