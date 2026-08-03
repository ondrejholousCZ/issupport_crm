"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { currentMesic, praceFiltersToQuery, type PraceFilters } from "@/lib/prace-filters";
import { stavFakturaceLabels } from "@/lib/labels";

const controlClass =
  "h-[38px] w-full min-w-0 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

type Option = { id: string; label: string; zakaznik_id?: string };

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
}: {
  filters: PraceFilters;
  pracovnici: Option[];
  projekty: Option[];
  zakaznici: Option[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const filteredProjekty = useMemo(() => {
    if (!filters.zakaznikId) return projekty;
    return projekty.filter((p) => p.zakaznik_id === filters.zakaznikId);
  }, [projekty, filters.zakaznikId]);

  const applyFilters = useCallback(
    (next: Partial<PraceFilters>) => {
      const merged: PraceFilters = { ...filters, ...next };
      if (next.zakaznikId !== undefined && next.zakaznikId !== filters.zakaznikId) {
        merged.projektId = undefined;
      }
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
      const params = new URLSearchParams();
      params.set("mesic", filters.mesic);
      if (filters.pracovnikId) params.set("pracovnik", filters.pracovnikId);
      if (filters.projektId) params.set("projekt", filters.projektId);
      if (filters.zakaznikId) params.set("zakaznik", filters.zakaznikId);
      if (filters.stav) params.set("stav", filters.stav);

      const res = await fetch(`/api/prace/export?${params}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setExportError(data?.error ?? "Export se nezdařil.");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `Vykaz_prace_${filters.mesic.replace("-", "")}.xlsx`;

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
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
        <FilterField label="Měsíc" className="w-[148px]">
          <input
            type="month"
            value={filters.mesic}
            onChange={(e) => applyFilters({ mesic: e.target.value || currentMesic() })}
            className={controlClass}
          />
        </FilterField>

        <FilterField label="Pracovník" className="w-[180px]">
          <select
            value={filters.pracovnikId ?? ""}
            onChange={(e) => applyFilters({ pracovnikId: e.target.value || undefined })}
            className={controlClass}
          >
            <option value="">Všichni</option>
            {pracovnici.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Zákazník" className="w-[200px]">
          <select
            value={filters.zakaznikId ?? ""}
            onChange={(e) => applyFilters({ zakaznikId: e.target.value || undefined })}
            className={controlClass}
          >
            <option value="">Všichni</option>
            {zakaznici.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Projekt" className="w-[220px]">
          <select
            value={filters.projektId ?? ""}
            onChange={(e) => applyFilters({ projektId: e.target.value || undefined })}
            className={controlClass}
          >
            <option value="">Všechny</option>
            {filteredProjekty.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Stav" className="w-[160px]">
          <select
            value={filters.stav ?? ""}
            onChange={(e) => applyFilters({ stav: e.target.value || undefined })}
            className={controlClass}
          >
            <option value="">Všechny</option>
            {Object.entries(stavFakturaceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
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
      {exportError ? <p className="text-sm text-red-600">{exportError}</p> : null}
    </div>
  );
}
