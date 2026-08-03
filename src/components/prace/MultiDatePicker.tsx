"use client";

import { useEffect, useState } from "react";
import { CalendarPanel } from "@/components/ui/CalendarPanel";
import { Popover } from "@/components/ui/Popover";
import { formatDate, todayIso } from "@/lib/format";
import { viewMonthFromIso } from "@/lib/calendar";

const triggerClass =
  "w-full h-[38px] rounded-lg border border-border bg-white px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary/30 hover:bg-gray-50/80";

export function MultiDatePicker({ defaultValue }: { defaultValue?: string }) {
  const initial = defaultValue ?? todayIso();
  const [multiMode, setMultiMode] = useState(false);
  const [singleDate, setSingleDate] = useState(initial);
  const [singleOpen, setSingleOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => new Set([initial]));
  const [viewMonth, setViewMonth] = useState(() => viewMonthFromIso(initial));

  useEffect(() => {
    if (!multiMode) setViewMonth(viewMonthFromIso(singleDate));
  }, [singleDate, multiMode]);

  useEffect(() => {
    if (!multiMode) setSingleOpen(false);
  }, [singleDate, multiMode]);

  const toggleDate = (iso: string) => {
    if (multiMode) {
      setSelectedDates((prev) => {
        const next = new Set(prev);
        if (next.has(iso)) next.delete(iso);
        else next.add(iso);
        return next;
      });
    } else {
      setSingleDate(iso);
      setSelectedDates(new Set([iso]));
      setSingleOpen(false);
    }
  };

  const sortedSelected = [...selectedDates].sort();

  const dayClassName = (iso: string) => {
    if (selectedDates.has(iso)) {
      return "bg-primary text-white font-medium hover:bg-primary/90";
    }
    return "hover:bg-gray-100 text-foreground";
  };

  return (
    <div className="block">
      <span className="block text-sm font-medium mb-1.5">
        Datum
        <span className="text-red-500 ml-0.5">*</span>
      </span>

      <label className="flex items-center gap-2 mb-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={multiMode}
          onChange={(e) => {
            const next = e.target.checked;
            setMultiMode(next);
            if (next) {
              setSelectedDates(new Set());
              setViewMonth(viewMonthFromIso(singleDate));
            } else if (sortedSelected.length > 0) {
              setSingleDate(sortedSelected[0]);
              setSelectedDates(new Set([sortedSelected[0]]));
            }
          }}
          className="rounded border-border"
        />
        Více dní
      </label>

      {multiMode ? (
        <>
          <input type="hidden" name="datums" value={sortedSelected.join(",")} />
          <div className="rounded-lg border border-border p-2 bg-white shadow-sm">
            <CalendarPanel
              viewMonth={viewMonth}
              onViewMonthChange={setViewMonth}
              onDayClick={toggleDate}
              dayClassName={dayClassName}
              footer={
                sortedSelected.length > 0 ? (
                  <p className="text-xs text-gray-500">
                    Vybráno: {sortedSelected.length}{" "}
                    {sortedSelected.length === 1 ? "den" : sortedSelected.length < 5 ? "dny" : "dní"}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600">Vyberte alespoň jeden den</p>
                )
              }
            />
          </div>
          {sortedSelected.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {sortedSelected.map((iso) => (
                <li key={iso}>
                  <button
                    type="button"
                    onClick={() => toggleDate(iso)}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-200"
                    title="Odebrat den"
                  >
                    {formatDate(iso)}
                    <span aria-hidden className="text-gray-500">
                      ×
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <>
          <input type="hidden" name="datum" value={singleDate} />
          <Popover
            open={singleOpen}
            onClose={() => setSingleOpen(false)}
            trigger={
              <button
                type="button"
                onClick={() => setSingleOpen((v) => !v)}
                className={triggerClass}
                aria-expanded={singleOpen}
              >
                {formatDate(singleDate)}
              </button>
            }
          >
            <CalendarPanel
              viewMonth={viewMonth}
              onViewMonthChange={setViewMonth}
              onDayClick={toggleDate}
              dayClassName={dayClassName}
            />
          </Popover>
        </>
      )}
    </div>
  );
}
