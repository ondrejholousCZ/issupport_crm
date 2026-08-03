export function normalizeIco(value: string): string {
  return value.replace(/\D/g, "");
}

/** Kontrola formátu a kontrolní číslice českého IČO. */
export function isValidCzechIco(value: string): boolean {
  const ico = normalizeIco(value);
  if (!/^\d{8}$/.test(ico)) {
    return false;
  }

  const digits = ico.split("").map(Number);
  let sum = 0;
  for (let index = 0; index < 7; index += 1) {
    sum += digits[index] * (8 - index);
  }

  const mod = sum % 11;
  const expectedLast = mod === 0 ? 1 : mod === 1 ? 0 : 11 - mod;
  return digits[7] === expectedLast;
}
