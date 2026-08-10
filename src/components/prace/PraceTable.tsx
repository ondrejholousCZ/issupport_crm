"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  assignPraceToVykazAction,
  createVykazFromPraceAction,
} from "@/lib/actions/vykaz-prace";
import { deletePraceBulkAction, updatePraceStavBulkAction } from "@/lib/actions/prace";
import type { OdvedenaPrace, VykazPrace } from "@/lib/types";
import { formatCas, formatDate, formatMoney } from "@/lib/format";
import { isMesicObdobi } from "@/lib/prace-filters";
import { stavFakturaceLabels } from "@/lib/labels";
import { exportCastka } from "@/lib/work-hours";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SubmitButton } from "@/components/ui/SubmitButton";

const bulkSelectClass =
  "h-[38px] rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function displayCastka(row: OdvedenaPrace): string {
  const amount = exportCastka(
    row.hodiny,
    row.minuty,
    row.projekt_sazba_fak,
    row.castka_fakturace,
    row.projekt_jednotka_sazby ?? "hodina",
  );
  return formatMoney(amount);
}

function stavTone(stav: OdvedenaPrace["stav_fakturace"]) {
  if (stav === "nefakturovano") return "yellow" as const;
  if (stav === "schvaleni_vykazu") return "blue" as const;
  if (stav === "fakturovano") return "green" as const;
  return "gray" as const;
}

export function PraceTable({
  rows,
  returnQuery,
  obdobi,
  rozpracovaneVykazy,
}: {
  rows: OdvedenaPrace[];
  returnQuery: string;
  obdobi: string;
  rozpracovaneVykazy: VykazPrace[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const canCreateVykaz = isMesicObdobi(obdobi);

  const lockedZakaznikId = useMemo(() => {
    if (selected.size === 0) return null;
    const first = rows.find((r) => selected.has(r.id));
    return first?.zakaznik_id ?? null;
  }, [selected, rows]);

  const selectableIds = useMemo(() => {
    return rows
      .filter((row) => {
        if (row.vykaz_id) return false;
        if (row.stav_fakturace === "fakturovano") return false;
        if (lockedZakaznikId && row.zakaznik_id !== lockedZakaznikId) return false;
        return true;
      })
      .map((r) => r.id);
  }, [rows, lockedZakaznikId]);

  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  const vykazyProZakaznika = useMemo(() => {
    if (!lockedZakaznikId) return [];
    return rozpracovaneVykazy.filter((v) => v.zakaznik_id === lockedZakaznikId);
  }, [rozpracovaneVykazy, lockedZakaznikId]);

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  };

  const toggleOne = (row: OdvedenaPrace) => {
    if (row.vykaz_id || row.stav_fakturace === "fakturovano") return;
    if (lockedZakaznikId && row.zakaznik_id !== lockedZakaznikId && !selected.has(row.id)) return;

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
  };

  const canSelect = (row: OdvedenaPrace) => {
    if (row.vykaz_id || row.stav_fakturace === "fakturovano") return false;
    if (lockedZakaznikId && row.zakaznik_id !== lockedZakaznikId) return false;
    return true;
  };

  return (
    <div className="space-y-3">
      {someSelected ? (
        <div className="flex flex-wrap items-center gap-3">
          {canCreateVykaz ? (
            <>
              <form action={createVykazFromPraceAction} className="flex items-center gap-2">
                {[...selected].map((id) => (
                  <input key={id} type="hidden" name="ids" value={id} />
                ))}
                <input type="hidden" name="obdobi" value={obdobi} />
                <input type="hidden" name="returnTo" value={returnQuery} />
                <SubmitButton>Vytvořit výkaz ({selected.size})</SubmitButton>
              </form>

              {vykazyProZakaznika.length > 0 ? (
                <form action={assignPraceToVykazAction} className="flex items-center gap-2">
                  {[...selected].map((id) => (
                    <input key={id} type="hidden" name="ids" value={id} />
                  ))}
                  <input type="hidden" name="returnTo" value={returnQuery} />
                  <select name="vykaz_id" required className={bulkSelectClass} defaultValue="">
                    <option value="" disabled>
                      — přiřadit k výkazu —
                    </option>
                    {vykazyProZakaznika.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.obdobi} ({v.zakaznik_nazev})
                      </option>
                    ))}
                  </select>
                  <SubmitButton variant="secondary">Přiřadit</SubmitButton>
                </form>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-amber-700">Pro výkaz vyberte konkrétní měsíc (ne celý rok).</p>
          )}

          <form action={updatePraceStavBulkAction} className="flex items-center gap-2">
            {[...selected].map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <input type="hidden" name="returnTo" value={returnQuery} />
            <select name="stav_fakturace" required className={bulkSelectClass} defaultValue="fakturovano">
              {Object.entries(stavFakturaceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <SubmitButton variant="secondary">Změnit stav ({selected.size})</SubmitButton>
          </form>

          <form
            action={deletePraceBulkAction}
            onSubmit={(e) => {
              if (!confirm(`Opravdu smazat ${selected.size} vybraných záznamů?`)) {
                e.preventDefault();
              }
            }}
            className="flex items-center gap-2"
          >
            {[...selected].map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <input type="hidden" name="returnTo" value={returnQuery} />
            <SubmitButton variant="danger">Smazat ({selected.size})</SubmitButton>
          </form>

          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            Zrušit výběr
          </button>
        </div>
      ) : null}

      {lockedZakaznikId ? (
        <p className="text-xs text-gray-500">
          Výběr je omezen na jednoho zákazníka — lze přidat jen práci stejného zákazníka.
        </p>
      ) : null}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={selectableIds.length === 0}
                  aria-label="Vybrat vše"
                  className="rounded border-border"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium">Datum</th>
              <th className="text-left px-4 py-3 font-medium">Zákazník</th>
              <th className="text-left px-4 py-3 font-medium">Projekt</th>
              <th className="text-left px-4 py-3 font-medium">Pracovník</th>
              <th className="text-left px-4 py-3 font-medium min-w-[180px]">Popis</th>
              <th className="text-left px-4 py-3 font-medium">Čas</th>
              <th className="text-left px-4 py-3 font-medium">Fakturace</th>
              <th className="text-left px-4 py-3 font-medium">Stav</th>
              <th className="w-20 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selectable = canSelect(row);
              return (
                <tr
                  key={row.id}
                  className={`border-b border-border last:border-0 hover:bg-gray-50/80 ${
                    selected.has(row.id) ? "bg-primary/5" : ""
                  } ${!selectable ? "opacity-50" : ""}`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleOne(row)}
                      disabled={!selectable && !selected.has(row.id)}
                      aria-label={`Vybrat záznam ${formatDate(row.datum)}`}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.datum)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/zakaznici/${row.zakaznik_id}`}
                      className="text-primary hover:underline font-medium block"
                    >
                      {row.zakaznik_nazev}
                    </Link>
                    <span className="text-gray-500 text-xs line-clamp-1">{row.projekt_nazev}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {row.projekt_zakazka ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.pracovnik_jmeno}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">
                    <span className="line-clamp-2" title={row.popis ?? undefined}>
                      {row.popis ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatCas(row.hodiny, row.minuty)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{displayCastka(row)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={stavFakturaceLabels[row.stav_fakturace]}
                      tone={stavTone(row.stav_fakturace)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/prace?${returnQuery ? `${returnQuery}&` : ""}upravit=${row.id}`}
                      className="text-primary hover:underline text-xs font-medium"
                    >
                      Upravit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
