"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Option = { id: string; label: string };

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function PraceExportForm({ pracovnici }: { pracovnici: Option[] }) {
  const [mesic, setMesic] = useState(currentMonth());
  const [pracovnikId, setPracovnikId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ mesic });
      if (pracovnikId) params.set("pracovnik_id", pracovnikId);

      const res = await fetch(`/api/prace/export?${params}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Export se nezdařil.");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `Vykaz_prace_${mesic.replace("-", "")}.xlsx`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export se nezdařil. Zkontrolujte připojení.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="block text-sm">
        <span className="block font-medium mb-1">Měsíc</span>
        <input
          type="month"
          value={mesic}
          onChange={(e) => setMesic(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="block font-medium mb-1">Pracovník</span>
        <select
          value={pracovnikId}
          onChange={(e) => setPracovnikId(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm min-w-[160px]"
        >
          <option value="">Všichni</option>
          {pracovnici.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <Button type="button" onClick={handleExport} loading={loading} variant="secondary">
        Export Excel
      </Button>
      {error ? <p className="text-sm text-red-600 w-full">{error}</p> : null}
    </div>
  );
}
