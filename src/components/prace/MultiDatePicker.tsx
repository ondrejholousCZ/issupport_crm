"use client";

import { useMemo, useState } from "react";
import { todayIso } from "@/lib/format";

const dayLabels = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const monthLabels = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
];

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startOffset = (first.getDay() + 6) % 7;
  const cells: Array<{ day: number; iso: string } | null> = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= lastDay; day++) {
    cells.push({ day, iso: isoDate(year, month, day) });
  }
  return cells;
}

export function MultiDatePicker({ defaultValue }: { defaultValue?: string }) {
  const initial = defaultValue ?? todayIso();
  const initialDate = new Date(initial);
  const [multiMode, setMultiMode] = useState(false);
  const [singleDate, setSingleDate] = useState(initial);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => new Set([initial]));
  const [viewMonth, setViewMonth] = useState({
    year: initialDate.getFullYear(),
    month: initialDate.getMonth(),
  });

  const cells = useMemo(
    () => buildMonthGrid(viewMonth.year, viewMonth.month),
    [viewMonth.year, viewMonth.month],
  );

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
    }
  };

  const shiftMonth = (delta: number) => {
    setViewMonth((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const sortedSelected = [...selectedDates].sort();

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
              setSelectedDates(new Set([singleDate]));
            } else if (sortedSelected.length > 0) {
              setSingleDate(sortedSelected[0]);
            }
          }}
          className="rounded border-border"
        />
        Více dní
      </label>

      {multiMode ? (
        <>
          <input type="hidden" name="datums" value={sortedSelected.join(",")} />
          <div className="rounded-lg border border-border p-2 bg-white">
            <div className="flex items-center justify-between mb-2 px-1">
              <button type="button" onClick={() => shiftMonth(-1)} className="px-2 py-1 text-sm rounded hover:bg-gray-100">
                ‹
              </button>
              <span className="text-sm font-medium">
                {monthLabels[viewMonth.month]} {viewMonth.year}
              </span>
              <button type="button" onClick={() => shiftMonth(1)} className="px-2 py-1 text-sm rounded hover:bg-gray-100">
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-gray-500 mb-1">
              {dayLabels.map((d) => (
                <span key={d} className="py-1">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((cell, idx) =>
                cell ? (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => toggleDate(cell.iso)}
                    className={`h-8 rounded text-sm transition-colors ${
                      selectedDates.has(cell.iso)
                        ? "bg-primary text-white font-medium"
                        : "hover:bg-gray-100 text-foreground"
                    }`}
                  >
                    {cell.day}
                  </button>
                ) : (
                  <span key={`empty-${idx}`} />
                ),
              )}
            </div>
            {sortedSelected.length > 0 ? (
              <p className="text-xs text-gray-500 mt-2 px-1">
                Vybráno: {sortedSelected.length}{" "}
                {sortedSelected.length === 1 ? "den" : sortedSelected.length < 5 ? "dny" : "dní"}
              </p>
            ) : (
              <p className="text-xs text-amber-600 mt-2 px-1">Vyberte alespoň jeden den</p>
            )}
          </div>
        </>
      ) : (
        <input
          type="date"
          name="datum"
          required
          value={singleDate}
          onChange={(e) => {
            setSingleDate(e.target.value);
            setSelectedDates(new Set([e.target.value]));
          }}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      )}
    </div>
  );
}
