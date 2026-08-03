"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deletePraceBulkAction, updatePraceStavBulkAction } from "@/lib/actions/prace";
import type { OdvedenaPrace } from "@/lib/types";
import { formatCas, formatDate, formatMoney } from "@/lib/format";
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
  );
  return formatMoney(amount);
}

export function PraceTable({
  rows,
  returnQuery,
}: {
  rows: OdvedenaPrace[];
  returnQuery: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allIds));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {someSelected ? (
        <div className="flex flex-wrap items-center gap-3">
          <form
            action={updatePraceStavBulkAction}
            className="flex items-center gap-2"
          >
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

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
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
            {rows.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-border last:border-0 hover:bg-gray-50/80 ${selected.has(row.id) ? "bg-primary/5" : ""}`}
              >
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleOne(row.id)}
                    aria-label={`Vybrat záznam ${formatDate(row.datum)}`}
                    className="rounded border-border"
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.datum)}</td>
                <td className="px-4 py-3">
                  <Link href={`/prace/${row.id}`} className="text-primary hover:underline font-medium block">
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
                    tone={row.stav_fakturace === "nefakturovano" ? "yellow" : "green"}
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
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
