const czDate = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

const czMoney = new Intl.NumberFormat("cs-CZ", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return czDate.format(d);
}

export function formatMoney(value: string | number | null | undefined, mena = "CZK"): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";
  return `${czMoney.format(num)} ${mena}`;
}

export function formatCas(hodiny: number, minuty: number): string {
  if (minuty === 0) return `${hodiny} h`;
  return `${hodiny} h ${minuty} min`;
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
