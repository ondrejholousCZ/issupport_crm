"use client";

import { useEffect, useState } from "react";
import { CalendarPanel } from "@/components/ui/CalendarPanel";
import { Popover } from "@/components/ui/Popover";
import { buildMesic, splitMesic } from "@/lib/prace-filters";
import { formatMesicLabel, viewMonthFromIso } from "@/lib/calendar";

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
  const [viewMonth, setViewMonth] = useState(() => viewMonthFromIso(`${value}-01`));

  useEffect(() => {
    setViewMonth(viewMonthFromIso(`${value}-01`));
  }, [value]);

  const pickDay = (iso: string) => {
    const [y, m] = iso.split("-");
    onChange(buildMesic(Number(y), Number(m)));
    setOpen(false);
  };

  const dayClassName = (iso: string) => {
    const [, m] = iso.split("-");
    const inSelectedMonth = Number(m) === mesicCislo && viewMonth.year === rok;
    if (inSelectedMonth && viewMonth.month + 1 === mesicCislo) {
      return "bg-primary/15 text-primary font-medium hover:bg-primary/25";
    }
    return "hover:bg-gray-100 text-foreground";
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
      <CalendarPanel
        viewMonth={viewMonth}
        onViewMonthChange={setViewMonth}
        onDayClick={pickDay}
        dayClassName={dayClassName}
        footer={
          <p className="text-xs text-gray-500">
            Kliknutím na den vyberete celý měsíc ({formatMesicLabel(value)})
          </p>
        }
      />
    </Popover>
  );
}
