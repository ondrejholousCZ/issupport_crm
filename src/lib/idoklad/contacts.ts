import {
  idokladRequest,
  type IdokladItemResponse,
  type IdokladListResponse,
} from "@/lib/idoklad/client";

export type IdokladContact = {
  Id: number;
  CompanyName: string;
  IdentificationNumber: string | null;
};

export async function findContactByIco(ico: string): Promise<IdokladContact | null> {
  const clean = ico.replace(/\s/g, "");
  if (!clean) return null;

  const res = await idokladRequest<IdokladListResponse<IdokladContact>>(
    "GET",
    `Contacts?filter=IdentificationNumber~eq~${encodeURIComponent(clean)}&pageSize=1`,
  );
  return res.Data?.Items?.[0] ?? null;
}

export async function getContact(id: number): Promise<IdokladContact | null> {
  const res = await idokladRequest<IdokladItemResponse<IdokladContact>>(
    "GET",
    `Contacts/${id}`,
  );
  return res.Data ?? null;
}

export async function resolvePartnerId(ico: string | null, storedId: number | null): Promise<number> {
  if (storedId) {
    const contact = await getContact(storedId);
    if (contact) return storedId;
  }
  if (!ico) {
    throw new Error("Zákazník nemá IČO ani iDoklad partner ID.");
  }
  const found = await findContactByIco(ico);
  if (!found) {
    throw new Error(`Kontakt s IČO ${ico} nebyl v iDokladu nalezen.`);
  }
  return found.Id;
}
