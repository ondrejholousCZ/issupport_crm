export function parseCas(value: string): { hodiny: number; minuty: number } {
  const trimmed = value.trim();
  if (!trimmed) return { hodiny: 0, minuty: 0 };

  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    return {
      hodiny: Number(colonMatch[1]),
      minuty: Math.min(59, Number(colonMatch[2])),
    };
  }

  const decimal = Number(trimmed.replace(",", "."));
  if (Number.isFinite(decimal) && (trimmed.includes(",") || trimmed.includes("."))) {
    const hodiny = Math.floor(decimal);
    const minuty = Math.round((decimal - hodiny) * 60);
    return { hodiny, minuty: Math.min(59, minuty) };
  }

  const hours = Number(trimmed);
  if (Number.isFinite(hours) && hours >= 0) {
    return { hodiny: Math.floor(hours), minuty: 0 };
  }

  return { hodiny: 0, minuty: 0 };
}

export function formatCasInput(hodiny: number, minuty: number): string {
  if (minuty === 0) return String(hodiny);
  return `${hodiny}:${String(minuty).padStart(2, "0")}`;
}
