"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function DraggableModal({
  open,
  onClose,
  title,
  children,
  widthClass = "w-full max-w-2xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  widthClass?: string;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const center = () => {
      const w = modalRef.current?.offsetWidth ?? 640;
      const h = modalRef.current?.offsetHeight ?? 480;
      setPosition({
        x: Math.max(16, (window.innerWidth - w) / 2),
        y: Math.max(16, (window.innerHeight - h) / 2),
      });
    };
    center();
    window.addEventListener("resize", center);
    return () => window.removeEventListener("resize", center);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.origX + dx,
      y: dragRef.current.origY + dy,
    });
  }, []);

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  const onHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Zavřít"
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        className={`absolute ${widthClass} rounded-xl border border-border bg-white shadow-2xl flex flex-col max-h-[calc(100vh-2rem)]`}
        style={{ left: position.x, top: position.y }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="draggable-modal-title"
      >
        <div
          className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border cursor-grab active:cursor-grabbing select-none shrink-0"
          onMouseDown={onHeaderMouseDown}
        >
          <h2 id="draggable-modal-title" className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
            aria-label="Zavřít okno"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
