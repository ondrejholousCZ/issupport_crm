"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deletePraceBulkAction } from "@/lib/actions/prace";
import type { OdvedenaPrace } from "@/lib/types";
import { formatCas, formatDate, formatMoney } from "@/lib/format";
import { stavFakturaceLabels } from "@/lib/labels";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function PraceTable({ rows }: { rows: OdvedenaPrace[] }) {
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
        <form
          action={deletePraceBulkAction}
          onSubmit={(e) => {
            if (!confirm(`Opravdu smazat ${selected.size} vybraných záznamů?`)) {
              e.preventDefault();
            }
          }}
          className="flex items-center gap-3"
        >
          {[...selected].map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
          <SubmitButton variant="danger">Smazat vybrané ({selected.size})</SubmitButton>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            Zrušit výběr
          </button>
        </form>
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
              <th className="text-left px-4 py-3 font-medium">Zákazník / Projekt</th>
              <th className="text-left px-4 py-3 font-medium">Pracovník</th>
              <th className="text-left px-4 py-3 font-medium">Čas</th>
              <th className="text-left px-4 py-3 font-medium">Fakturace</th>
              <th className="text-left px-4 py-3 font-medium">Stav</th>
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
                <td className="px-4 py-3">{formatDate(row.datum)}</td>
                <td className="px-4 py-3">
                  <Link href={`/prace/${row.id}`} className="text-primary hover:underline font-medium block">
                    {row.zakaznik_nazev}
                  </Link>
                  <span className="text-gray-500 text-xs">{row.projekt_nazev}</span>
                </td>
                <td className="px-4 py-3">{row.pracovnik_jmeno}</td>
                <td className="px-4 py-3">{formatCas(row.hodiny, row.minuty)}</td>
                <td className="px-4 py-3">{formatMoney(row.castka_fakturace)}</td>
                <td className="px-4 py-3">
                  <StatusBadge
                    label={stavFakturaceLabels[row.stav_fakturace]}
                    tone={row.stav_fakturace === "nefakturovano" ? "yellow" : "green"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
