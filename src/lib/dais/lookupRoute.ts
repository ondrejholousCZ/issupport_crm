import { lookupCompanyByIco } from "@/lib/dais/companyLookup";
import { isDaisApiConfigured } from "@/lib/dais/config";
import { DaisApiError, DaisCompanyNotFoundError } from "@/lib/dais/errors";
import { isValidCzechIco, normalizeIco } from "@/lib/ico";

export type IcoLookupSuccess = {
  ok: true;
  company: {
    name: string;
    ico: string;
    street: string;
    city: string;
    postalCode: string;
  };
};

export type IcoLookupFailure = {
  ok: false;
  status: number;
  error: string;
};

export async function resolveIcoLookup(icoRaw: string): Promise<IcoLookupSuccess | IcoLookupFailure> {
  if (!isDaisApiConfigured()) {
    return {
      ok: false,
      status: 503,
      error: "DAIS API není nakonfigurováno (chybí DAIS_API_KEY).",
    };
  }

  if (!isValidCzechIco(icoRaw)) {
    return {
      ok: false,
      status: 400,
      error: "Zadejte platné IČO (8 číslic).",
    };
  }

  try {
    const result = await lookupCompanyByIco(icoRaw);
    return {
      ok: true,
      company: {
        name: result.companyName,
        ico: normalizeIco(icoRaw),
        street: result.street,
        city: result.city,
        postalCode: result.postalCode,
      },
    };
  } catch (error) {
    if (error instanceof DaisCompanyNotFoundError) {
      return {
        ok: false,
        status: 404,
        error:
          "Subjekt s tímto IČO nebyl nalezen v DAIS portálu. Zkontrolujte správnost IČO.",
      };
    }

    if (error instanceof DaisApiError) {
      console.error("DAIS IČO lookup failed:", error.message);
      return {
        ok: false,
        status: 502,
        error: error.message,
      };
    }

    console.error("DAIS IČO lookup failed:", error);
    return {
      ok: false,
      status: 502,
      error: "Nepodařilo načíst údaje firmy z DAIS portálu. Zkuste to prosím později.",
    };
  }
}
