import { IDOKLAD_APP_URL, idokladRequest, type IdokladItemResponse } from "@/lib/idoklad/client";
import { getDefaultIssuedInvoiceSequence } from "@/lib/idoklad/numeric-sequences";

export type IdokladInvoiceItem = {
  Name: string;
  Amount: number;
  Unit: string;
  UnitPrice: number;
  PriceType: number;
  VatRateType: number;
  DiscountPercentage: number;
  IsTaxMovement: boolean;
};

export type CreateIdokladInvoiceInput = {
  partnerId: number;
  dateOfIssue: string;
  dateOfMaturity: string;
  dateOfTaxing: string;
  description?: string;
  items: IdokladInvoiceItem[];
  currencyId?: number;
  paymentOptionId?: number;
};

export type IdokladIssuedInvoice = {
  Id: number;
  DocumentNumber: string;
  DateOfIssue: string;
  DateOfMaturity: string;
  DateOfTaxing: string;
  PartnerId: number;
  Items?: Array<{
    Name: string;
    Amount: number;
    Prices?: { TotalWithoutVat?: number; TotalWithVat?: number };
  }>;
};

function vatRateType(dphSazba: number): number {
  return dphSazba <= 0 ? 2 : 1;
}

export function buildIdokladInvoiceItem(input: {
  nazev: string;
  mnozstvi: number;
  jednotka: string;
  cenaJednotka: number;
  dphSazba: number;
}): IdokladInvoiceItem {
  return {
    Name: input.nazev,
    Amount: Math.round(input.mnozstvi * 100) / 100,
    Unit: input.jednotka,
    UnitPrice: Math.round(input.cenaJednotka * 100) / 100,
    PriceType: 1,
    VatRateType: vatRateType(input.dphSazba),
    DiscountPercentage: 0,
    IsTaxMovement: false,
  };
}

export async function createIssuedInvoice(
  input: CreateIdokladInvoiceInput,
): Promise<IdokladIssuedInvoice> {
  const { numericSequenceId, nextDocumentSerialNumber } = await getDefaultIssuedInvoiceSequence();

  const payload = {
    PartnerId: input.partnerId,
    CurrencyId: input.currencyId ?? 1,
    PaymentOptionId: input.paymentOptionId ?? 1,
    NumericSequenceId: numericSequenceId,
    DocumentSerialNumber: nextDocumentSerialNumber,
    DateOfIssue: input.dateOfIssue,
    DateOfMaturity: input.dateOfMaturity,
    DateOfTaxing: input.dateOfTaxing,
    Description: input.description ?? "",
    IsEet: false,
    IsIncomeTax: true,
    Items: input.items,
  };

  const res = await idokladRequest<IdokladItemResponse<IdokladIssuedInvoice>>(
    "POST",
    "IssuedInvoices",
    payload,
  );

  if (!res.Data?.Id) {
    throw new Error("iDoklad nevrátil ID vytvořené faktury.");
  }
  return res.Data;
}

export function idokladInvoiceUrl(id: number): string {
  return `${IDOKLAD_APP_URL}/IssuedInvoice/Edit/${id}`;
}

export type IdokladInvoiceStatus = {
  Id: number;
  DocumentNumber: string;
  DateOfPayment: string | null;
  PaymentStatus: number;
};

export async function getIssuedInvoiceStatus(id: number): Promise<IdokladInvoiceStatus | null> {
  const res = await idokladRequest<IdokladItemResponse<IdokladInvoiceStatus>>(
    "GET",
    `IssuedInvoices/${id}`,
  );
  return res.Data ?? null;
}

/** PaymentStatus 2 = paid in iDoklad v3 */
export function isIdokladPaid(status: IdokladInvoiceStatus): boolean {
  return status.PaymentStatus === 2 || Boolean(status.DateOfPayment && status.DateOfPayment > "1753-01-02");
}
