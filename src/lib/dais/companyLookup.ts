import { DaisApiError, DaisCompanyNotFoundError } from "@/lib/dais/errors";
import { daisHttpGet } from "@/lib/dais/http";
import { isValidCzechIco, normalizeIco } from "@/lib/ico";

type DaisAresSection = {
  ico?: string;
  nazev?: string;
  ulicecela?: string;
  ulice_obalka?: string;
  ulice?: string;
  obec?: string;
  psc?: number | string;
};

type DaisDatovaSchranka = {
  city?: string;
};

type DaisCompanyLookupResponse = {
  ARES?: DaisAresSection | null;
  DS?: DaisDatovaSchranka[];
  INPUT?: {
    par?: string;
    code?: number;
    error?: string;
  };
  error?: string;
};

export type CompanyRegistryLookupResult = {
  ico: string;
  companyName: string;
  street: string;
  city: string;
  postalCode: string;
};

function formatPostalCode(value: number | string | undefined): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  const digits = String(value).replace(/\D/g, "");
  return digits.padStart(5, "0").slice(0, 5);
}

function resolveStreet(ares: DaisAresSection): string {
  return (
    ares.ulice_obalka?.trim() ||
    ares.ulicecela?.trim() ||
    ares.ulice?.trim() ||
    ""
  );
}

function resolveCity(data: DaisCompanyLookupResponse, ares: DaisAresSection): string {
  const dsCity = data.DS?.find((entry) => entry.city?.trim())?.city?.trim();
  if (dsCity) {
    return dsCity;
  }
  return ares.obec?.trim() ?? "";
}

function isNotFoundResponse(data: DaisCompanyLookupResponse): boolean {
  const inputCode = data.INPUT?.code;
  const inputError = data.INPUT?.error?.trim().toUpperCase() ?? "";

  if (inputCode === 4 || inputError.includes("NENALEZENO")) {
    return true;
  }

  if (inputError && inputError !== "OK") {
    return true;
  }

  return !data.ARES?.nazev?.trim();
}

export async function lookupCompanyByIco(icoRaw: string): Promise<CompanyRegistryLookupResult> {
  const ico = normalizeIco(icoRaw);
  if (!isValidCzechIco(ico)) {
    throw new DaisApiError("Zadejte platné IČO (8 číslic).");
  }

  const response = await daisHttpGet(`/ico/${ico}`);

  if (response.status === 401 || response.status === 403) {
    throw new DaisApiError("Přístup k DAIS API byl odmítnut. Zkontrolujte API klíč.");
  }

  if (response.status === 404) {
    throw new DaisCompanyNotFoundError(ico);
  }

  if (response.status < 200 || response.status >= 300) {
    throw new DaisApiError(`DAIS API odpovědělo HTTP ${response.status}.`);
  }

  let data: DaisCompanyLookupResponse;
  try {
    data = JSON.parse(response.body) as DaisCompanyLookupResponse;
  } catch {
    throw new DaisApiError("DAIS portál vrátil neplatnou odpověď.");
  }

  if (data.error) {
    throw new DaisApiError(data.error);
  }

  if (isNotFoundResponse(data)) {
    throw new DaisCompanyNotFoundError(ico);
  }

  const ares = data.ARES;
  if (!ares?.nazev?.trim()) {
    throw new DaisCompanyNotFoundError(ico);
  }

  return {
    ico: normalizeIco(ares.ico ?? ico),
    companyName: ares.nazev.trim(),
    street: resolveStreet(ares),
    city: resolveCity(data, ares),
    postalCode: formatPostalCode(ares.psc),
  };
}
