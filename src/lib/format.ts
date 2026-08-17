const czDate = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

const czMoney = new Intl.NumberFormat("cs-CZ", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

import { effectiveWorkHours } from "./work-hours";
import type { ProjektJednotkaSazby } from "./types";

/** Normalizuje datum z DB (string nebo Date) na YYYY-MM-DD. */
export function toDateIso(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return value.slice(0, 10);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "—";
    return czDate.format(value);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return czDate.format(d);
}

const czDateLong = new Intl.DateTimeFormat("cs-CZ", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Datum ve stylu „pondělí 1. června 2026“ pro e-maily. */
export function formatDateLong(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const formatted = czDateLong.format(d);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatMoney(value: string | number | null | undefined, mena = "CZK"): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";
  return `${czMoney.format(num)} ${mena}`;
}

export function formatProjektSazba(
  sazba: string | number | null | undefined,
  mena: string,
  jednotka: ProjektJednotkaSazby = "hodina",
): string {
  const suffix = jednotka === "md" ? "/MD" : "/h";
  return `${formatMoney(sazba, mena)}${suffix}`;
}

export function formatCas(hodiny: number, minuty: number): string {
  const total = effectiveWorkHours(hodiny, minuty);
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export type SluzbaUrgency = "overdue" | "soon" | "ok" | "unknown";

export function sluzbaUrgency(dalsiFakturace: string | null | undefined): SluzbaUrgency {
  const days = daysUntil(dalsiFakturace);
  if (days === null) return "unknown";
  if (days < 0) return "overdue";
  if (days <= 30) return "soon";
  return "ok";
}
