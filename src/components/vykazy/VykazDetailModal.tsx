"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  deleteVykazAction,
  removePolozkaFromVykazAction,
  sendVykazAction,
  unlockVykazAction,
} from "@/lib/actions/vykaz-prace";
import { DeleteForm } from "@/components/DeleteForm";
import { DraggableModal } from "@/components/ui/DraggableModal";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormField } from "@/components/ui/FormField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCas, formatDate, formatMoney } from "@/lib/format";
import { MESICE_LABELS } from "@/lib/prace-filters";
import { vykazStavLabels } from "@/lib/labels";
import type { Faktura, OdvedenaPrace, VykazPrace } from "@/lib/types";
import type { InvoiceDraft } from "@/lib/faktura-sablona";
import { summarizePrace, formatTotalHours } from "@/lib/prace-summary";
import { VykazInvoicePanel } from "@/components/vykazy/VykazInvoicePanel";

function obdobiLabel(obdobi: string) {
  const [rok, mesic] = obdobi.split("-");
  if (!mesic) return obdobi;
  return `${MESICE_LABELS[Number(mesic) - 1] ?? mesic} ${rok}`;
}

function vykazTone(stav: VykazPrace["stav"]) {
  if (stav === "schvaleny") return "green" as const;
  if (stav === "odeslany") return "blue" as const;
  return "yellow" as const;
}

export function VykazDetailModal({
  vykaz,
  polozky,
  invoiceDraft,
  linkedFaktura,
  fakturacniEmail = "",
}: {
  vykaz: VykazPrace | null;
  polozky: OdvedenaPrace[];
  invoiceDraft?: InvoiceDraft | null;
  linkedFaktura?: Faktura | null;
  fakturacniEmail?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(Boolean(vykaz));

  useEffect(() => {
    setOpen(Boolean(vykaz));
  }, [vykaz]);

  const close = useCallback(() => {
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("detail");
    const qs = params.toString();
    router.replace(qs ? `/vykazy?${qs}` : "/vykazy", { scroll: false });
  }, [router, searchParams]);

  if (!vykaz) return null;

  const summary = summarizePrace(polozky);
  const send = sendVykazAction.bind(null, vykaz.id);
  const unlock = unlockVykazAction.bind(null, vykaz.id);
  const deleteVykaz = deleteVykazAction.bind(null, vykaz.id);
  const editable = vykaz.stav === "rozpracovany";

  return (
    <DraggableModal
      open={open}
      onClose={close}
      title={`Výkaz: ${vykaz.zakaznik_nazev} — ${obdobiLabel(vykaz.obdobi)}`}
      closeOnBackdropClick={false}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <StatusBadge label={vykazStavLabels[vykaz.stav]} tone={vykazTone(vykaz.stav)} />
          <span className="text-gray-600">
            Položek: <strong>{polozky.length}</strong>
          </span>
          <span className="text-gray-600">
            Čas: <strong>{formatTotalHours(summary.totalHours)}</strong>
          </span>
          <span className="text-gray-600">
            Částka: <strong>{formatMoney(summary.totalCastka)}</strong>
          </span>
          {vykaz.odeslano_email ? (
            <span className="text-gray-600">
              Příjemce: <strong>{vykaz.odeslano_email}</strong>
            </span>
          ) : null}
        </div>

        {vykaz.poznamka_klienta ? (
          <div className="rounded-lg bg-gray-50 border border-border p-3 text-sm">
            <p className="text-xs font-medium text-gray-500 mb-1">Poznámka zákazníka</p>
            <p>{vykaz.poznamka_klienta}</p>
          </div>
        ) : null}

        <div className="max-h-64 overflow-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2">Datum</th>
                <th className="text-left px-3 py-2">Projekt</th>
                <th className="text-left px-3 py-2">Pracovník</th>
                <th className="text-left px-3 py-2">Čas</th>
                {editable ? <th className="w-16 px-2 py-2" /> : null}
              </tr>
            </thead>
            <tbody>
              {polozky.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(p.datum)}</td>
                  <td className="px-3 py-2">{p.projekt_zakazka ?? p.projekt_nazev}</td>
                  <td className="px-3 py-2">{p.pracovnik_jmeno}</td>
                  <td className="px-3 py-2">{formatCas(p.hodiny, p.minuty)}</td>
                  {editable ? (
                    <td className="px-2 py-2 text-right">
                      <form
                        action={removePolozkaFromVykazAction.bind(null, vykaz.id, p.id)}
                        onSubmit={(e) => {
                          if (!confirm("Odebrat tuto položku z výkazu?")) e.preventDefault();
                        }}
                      >
                        <button
                          type="submit"
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                          title="Odebrat z výkazu"
                        >
                          Odebrat
                        </button>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editable ? (
          <>
            <form action={send} className="space-y-3 border-t border-border pt-4">
              <FormField
                label="E-mail příjemce"
                name="email"
                type="email"
                defaultValue={vykaz.zakaznik_email ?? ""}
                hint="Pokud je prázdné, použije se kontaktní e-mail zákazníka."
              />
              <SubmitButton disabled={polozky.length === 0}>Odeslat ke schválení</SubmitButton>
            </form>

            <div className="border-t border-border pt-4">
              <DeleteForm action={deleteVykaz} label="Smazat celý výkaz" />
              <p className="text-xs text-gray-500 mt-2">
                Smazáním výkazu se uvolní všechny položky — budou znovu k dispozici v odvedené práci.
              </p>
            </div>
          </>
        ) : null}

        {vykaz.stav === "schvaleny" ? (
          <VykazInvoicePanel
            vykazId={vykaz.id}
            draft={invoiceDraft ?? null}
            faktura={linkedFaktura ?? null}
            fakturacniEmail={fakturacniEmail}
          />
        ) : null}

        {vykaz.stav === "odeslany" || vykaz.stav === "schvaleny" ? (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <form action={unlock}>
              <SubmitButton variant="secondary">Odemknout / upravit</SubmitButton>
            </form>
            {vykaz.stav === "odeslany" && vykaz.approval_token ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const url = `${window.location.origin}/schvaleni/${vykaz.approval_token}`;
                  void navigator.clipboard.writeText(url);
                }}
              >
                Kopírovat odkaz ke schválení
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </DraggableModal>
  );
}
