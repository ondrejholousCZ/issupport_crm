export function formStr(formData: FormData, key: string): string {
  return formData.get(key)?.toString().trim() ?? "";
}

export function formOptStr(formData: FormData, key: string): string | undefined {
  const value = formStr(formData, key);
  return value || undefined;
}

export function formInt(formData: FormData, key: string, fallback = 0): number {
  const raw = formStr(formData, key);
  const num = Number(raw);
  return Number.isFinite(num) ? num : fallback;
}

export function formOptInt(formData: FormData, key: string): number | null {
  const raw = formStr(formData, key);
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}
