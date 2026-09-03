import {
  idokladRequest,
  type IdokladListResponse,
} from "@/lib/idoklad/client";

export type IdokladBankAccount = {
  Id: number;
  AccountNumber: string;
  BankId: number | null;
  CurrencyId: number | null;
  Iban: string;
  Swift: string;
  IsDefault: boolean;
  Name: string;
};

export type InvoiceBankDetails = {
  AccountNumber: string;
  BankId?: number;
  Iban?: string;
  Swift?: string;
};

function normalizeBool(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const v = value.toLowerCase();
    return v === "true" || v === "1";
  }
  return false;
}

function asString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function asOptionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseBankAccount(raw: unknown): IdokladBankAccount | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const Id = Number(o.Id ?? o.id);
  if (!Number.isFinite(Id)) return null;

  return {
    Id,
    AccountNumber: asString(o.AccountNumber ?? o.accountNumber),
    BankId: asOptionalNumber(o.BankId ?? o.bankId),
    CurrencyId: asOptionalNumber(o.CurrencyId ?? o.currencyId),
    Iban: asString(o.Iban ?? o.iban),
    Swift: asString(o.Swift ?? o.swift),
    IsDefault: normalizeBool(o.IsDefault ?? o.isDefault),
    Name: asString(o.Name ?? o.name),
  };
}

function pickDefaultAccount(
  items: IdokladBankAccount[],
  currencyId: number,
): IdokladBankAccount {
  const forCurrency = items.filter(
    (a) => a.CurrencyId == null || a.CurrencyId === currencyId,
  );
  const pool = forCurrency.length ? forCurrency : items;
  const picked =
    pool.find((a) => a.IsDefault && a.AccountNumber) ??
    pool.find((a) => a.IsDefault) ??
    pool.find((a) => a.AccountNumber) ??
    pool[0];

  if (!picked?.AccountNumber) {
    throw new Error(
      "Výchozí bankovní účet v iDokladu nemá vyplněné číslo účtu. Doplňte ho v Nastavení → Banka.",
    );
  }
  return picked;
}

function toInvoiceBankDetails(account: IdokladBankAccount): InvoiceBankDetails {
  const details: InvoiceBankDetails = { AccountNumber: account.AccountNumber };
  if (account.BankId) details.BankId = account.BankId;
  if (account.Iban) details.Iban = account.Iban;
  if (account.Swift) details.Swift = account.Swift;
  return details;
}

export async function getDefaultBankAccountDetails(
  currencyId = 1,
): Promise<InvoiceBankDetails> {
  const res = await idokladRequest<IdokladListResponse<unknown>>(
    "GET",
    "BankAccounts?pageSize=100",
  );

  const items = (res.Data?.Items ?? [])
    .map(parseBankAccount)
    .filter((a): a is IdokladBankAccount => a != null);

  if (!items.length) {
    throw new Error(
      "V iDokladu chybí bankovní účet. Přidejte výchozí účet v Nastavení → Banka.",
    );
  }

  return toInvoiceBankDetails(pickDefaultAccount(items, currencyId));
}
