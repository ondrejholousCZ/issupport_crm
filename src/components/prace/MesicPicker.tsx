"use client";

import { useEffect, useState } from "react";
import { Popover } from "@/components/ui/Popover";
import { MONTH_LABELS, formatMesicLabel } from "@/lib/calendar";
import { buildMesic, splitMesic } from "@/lib/prace-filters";

const triggerClass =
  "h-[38px] w-full rounded-lg border border-border bg-white px-3 text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary/30 hover:bg-gray-50/80";

export function MesicPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (mesic: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { rok, mesic: mesicCislo } = splitMesic(value);
  const wholeYear = mesicCislo === null;
  const [viewYear, setViewYear] = useState(rok);

  useEffect(() => {
    setViewYear(rok);
  }, [rok]);

  useEffect(() => {
    setOpen(false);
  }, [value]);

  const pickMonth = (month: number) => {
    onChange(buildMesic(viewYear, month));
    setOpen(false);
  };

  const pickYear = () => {
    onChange(String(viewYear));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={triggerClass}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          {formatMesicLabel(value)}
        </button>
      }
    >
      <div className="w-[280px] p-1">
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            type="button"
            onClick={() => setViewYear((y) => y - 1)}
            className="px-2 py-1 text-sm rounded hover:bg-gray-100"
            aria-label="Předchozí rok"
          >
            ‹
          </button>
          <span className="text-sm font-medium">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear((y) => y + 1)}
            className="px-2 py-1 text-sm rounded hover:bg-gray-100"
            aria-label="Další rok"
          >
            ›
          </button>
        </div>

        <button
          type="button"
          onClick={pickYear}
          className={`mb-2 w-full rounded-lg px-2 py-2 text-sm transition-colors ${
            wholeYear && viewYear === rok
              ? "bg-primary text-white font-medium"
              : "hover:bg-gray-100 text-foreground"
          }`}
        >
          Celý rok {viewYear}
        </button>

        <div className="grid grid-cols-3 gap-1">
          {MONTH_LABELS.map((label, idx) => {
            const monthNum = idx + 1;
            const selected = !wholeYear && viewYear === rok && monthNum === mesicCislo;
            return (
              <button
                key={label}
                type="button"
                onClick={() => pickMonth(monthNum)}
                className={`rounded-lg px-2 py-2 text-sm transition-colors ${
                  selected
                    ? "bg-primary text-white font-medium"
                    : "hover:bg-gray-100 text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </Popover>
  );
}
