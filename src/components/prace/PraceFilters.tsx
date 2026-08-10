"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { MesicPicker } from "@/components/prace/MesicPicker";
import { PraceSummaryBar } from "@/components/prace/PraceSummaryBar";
import { Button } from "@/components/ui/Button";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { stavFakturaceLabels } from "@/lib/labels";
import { parseContentDispositionFilename } from "@/lib/content-disposition";
import { praceFiltersToQuery, praceFiltersToSearchParams, type PraceFilters } from "@/lib/prace-filters";

type Option = { id: string; label: string };

function FilterField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

export function PraceFilters({
  filters,
  pracovnici,
  projekty,
  zakaznici,
  summary,
}: {
  filters: PraceFilters;
  pracovnici: Option[];
  projekty: Option[];
  zakaznici: Option[];
  summary: { totalHours: number; totalCastka: number; count: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const stavOptions = useMemo(
    () => Object.entries(stavFakturaceLabels).map(([id, label]) => ({ id, label })),
    [],
  );

  const applyFilters = useCallback(
    (next: Partial<PraceFilters>) => {
      const merged: PraceFilters = { ...filters, ...next };
      const extra: Record<string, string> = {};
      const nova = searchParams.get("nova");
      const upravit = searchParams.get("upravit");
      if (nova) extra.nova = nova;
      if (upravit) extra.upravit = upravit;
      const qs = praceFiltersToQuery(merged, extra);
      startTransition(() => {
        router.push(qs ? `/prace?${qs}` : "/prace");
      });
    },
    [filters, router, searchParams],
  );

  async function handleExport() {
    setExportLoading(true);
    setExportError(null);
    try {
      const params = praceFiltersToSearchParams(filters);
      const res = await fetch(`/api/prace/export?${params}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setExportError(data?.error ?? "Export se nezdařil.");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename =
        parseContentDispositionFilename(disposition) ??
        `Vykaz_prace_${filters.mesic.replace("-", "")}.xlsx`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Export se nezdařil. Zkontrolujte připojení.");
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
        <FilterField label="Období" className="w-[200px]">
          <MesicPicker value={filters.mesic} onChange={(mesic) => applyFilters({ mesic })} />
        </FilterField>

        <FilterField label="Pracovník" className="w-[180px]">
          <MultiSelect
            options={pracovnici}
            value={filters.pracovnikIds}
            onChange={(pracovnikIds) => applyFilters({ pracovnikIds })}
            emptyLabel="Všichni"
          />
        </FilterField>

        <FilterField label="Zákazník" className="w-[200px]">
          <MultiSelect
            options={zakaznici}
            value={filters.zakaznikIds}
            onChange={(zakaznikIds) => applyFilters({ zakaznikIds })}
            emptyLabel="Všichni"
          />
        </FilterField>

        <FilterField label="Projekt" className="w-[220px]">
          <MultiSelect
            options={projekty}
            value={filters.projektNazvy}
            onChange={(projektNazvy) => applyFilters({ projektNazvy })}
            emptyLabel="Všechny"
          />
        </FilterField>

        <FilterField label="Stav" className="w-[180px]">
          <MultiSelect
            options={stavOptions}
            value={filters.stav}
            onChange={(stav) => applyFilters({ stav })}
            emptyLabel="Všechny"
          />
        </FilterField>

        <Button
          type="button"
          variant="secondary"
          onClick={handleExport}
          loading={exportLoading}
          className="shrink-0"
        >
          Export Excel
        </Button>
      </div>

      <PraceSummaryBar
        totalHours={summary.totalHours}
        totalCastka={summary.totalCastka}
        count={summary.count}
      />

      {exportError ? <p className="text-sm text-red-600">{exportError}</p> : null}
    </div>
  );
}
