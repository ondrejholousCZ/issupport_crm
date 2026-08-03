"use client";

import { useEffect, useMemo, useState } from "react";
import { Popover } from "@/components/ui/Popover";

const triggerClass =
  "h-[38px] w-full rounded-lg border border-border bg-white px-3 text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary/30 hover:bg-gray-50/80 truncate";

type Option = { id: string; label: string };

function sameSelection(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
}

export function MultiSelect({
  options,
  value,
  onChange,
  emptyLabel = "Vše",
}: {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);

  useEffect(() => {
    if (!open) setDraft(value);
  }, [value, open]);

  const label = useMemo(() => {
    if (value.length === 0) return emptyLabel;
    if (value.length === 1) {
      return options.find((o) => o.id === value[0])?.label ?? emptyLabel;
    }
    return `${value.length} vybráno`;
  }, [value, options, emptyLabel]);

  function closeAndApply() {
    setOpen(false);
    if (!sameSelection(draft, value)) {
      onChange(draft);
    }
  }

  function openPopover() {
    setDraft(value);
    setOpen(true);
  }

  function toggle(id: string) {
    setDraft((current) =>
      current.includes(id) ? current.filter((v) => v !== id) : [...current, id],
    );
  }

  return (
    <Popover
      open={open}
      onClose={closeAndApply}
      trigger={
        <button
          type="button"
          onClick={() => (open ? closeAndApply() : openPopover())}
          className={triggerClass}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {label}
        </button>
      }
    >
      <div className="min-w-[220px] max-h-[280px] overflow-y-auto p-1">
        {draft.length > 0 ? (
          <button
            type="button"
            onClick={() => setDraft([])}
            className="mb-1 w-full rounded-lg px-2 py-1.5 text-left text-xs text-gray-600 hover:bg-gray-100"
          >
            Vymazat výběr
          </button>
        ) : null}
        {options.map((opt) => (
          <label
            key={opt.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-100"
          >
            <input
              type="checkbox"
              checked={draft.includes(opt.id)}
              onChange={() => toggle(opt.id)}
              className="rounded border-border"
            />
            <span className="min-w-0 truncate">{opt.label}</span>
          </label>
        ))}
      </div>
    </Popover>
  );
}
