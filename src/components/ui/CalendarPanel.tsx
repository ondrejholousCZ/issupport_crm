"use client";

import { useMemo } from "react";
import {
  buildMonthGrid,
  DAY_LABELS,
  MONTH_LABELS,
  shiftViewMonth,
  type ViewMonth,
} from "@/lib/calendar";

export function CalendarPanel({
  viewMonth,
  onViewMonthChange,
  onDayClick,
  dayClassName,
  footer,
}: {
  viewMonth: ViewMonth;
  onViewMonthChange: (next: ViewMonth) => void;
  onDayClick: (iso: string) => void;
  dayClassName?: (iso: string) => string;
  footer?: React.ReactNode;
}) {
  const cells = useMemo(
    () => buildMonthGrid(viewMonth.year, viewMonth.month),
    [viewMonth.year, viewMonth.month],
  );

  return (
    <div className="w-[280px]">
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          type="button"
          onClick={() => onViewMonthChange(shiftViewMonth(viewMonth, -1))}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100"
          aria-label="Předchozí měsíc"
        >
          ‹
        </button>
        <span className="text-sm font-medium">
          {MONTH_LABELS[viewMonth.month]} {viewMonth.year}
        </span>
        <button
          type="button"
          onClick={() => onViewMonthChange(shiftViewMonth(viewMonth, 1))}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100"
          aria-label="Další měsíc"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-gray-500 mb-1">
        {DAY_LABELS.map((d) => (
          <span key={d} className="py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, idx) =>
          cell ? (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onDayClick(cell.iso)}
              className={`h-8 rounded text-sm transition-colors ${
                dayClassName?.(cell.iso) ?? "hover:bg-gray-100 text-foreground"
              }`}
            >
              {cell.day}
            </button>
          ) : (
            <span key={`empty-${idx}`} />
          ),
        )}
      </div>
      {footer ? <div className="mt-2 px-1">{footer}</div> : null}
    </div>
  );
}
