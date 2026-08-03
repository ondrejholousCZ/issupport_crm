"use client";

import { useEffect, useRef } from "react";

export function Popover({
  open,
  onClose,
  trigger,
  children,
  align = "left",
}: {
  open: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className="relative" ref={ref}>
      {trigger}
      {open ? (
        <>
          <button
            type="button"
            aria-label="Zavřít"
            className="fixed inset-0 z-40 cursor-default"
            onClick={onClose}
          />
          <div
            className={`absolute top-full z-50 mt-1 rounded-xl border border-border bg-white p-2 shadow-lg ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {children}
          </div>
        </>
      ) : null}
    </div>
  );
}
