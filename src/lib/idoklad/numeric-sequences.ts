import {
  idokladRequest,
  type IdokladItemResponse,
  type IdokladListResponse,
} from "@/lib/idoklad/client";

/** DocumentType 0 = vydané faktury */
const ISSUED_INVOICE_DOCUMENT_TYPE = 0;

export type IdokladNumericSequence = {
  Id: number;
  DocumentType: number;
  IsDefault: boolean;
  LastNumber: number;
  Year: number;
  NumberFormat: string;
};

export type IssuedInvoiceSequence = {
  numericSequenceId: number;
  /** iDoklad očekává řetězec, ne číslo */
  nextDocumentSerialNumber: string;
};

function normalizeBool(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const v = value.toLowerCase();
    return v === "true" || v === "1";
  }
  return false;
}

function parseNumericSequence(raw: unknown): IdokladNumericSequence | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const Id = Number(o.Id ?? o.id);
  const LastNumber = Number(o.LastNumber ?? o.lastNumber);
  const DocumentType = Number(o.DocumentType ?? o.documentType);
  const Year = Number(o.Year ?? o.year ?? 0);
  if (!Number.isFinite(Id)) return null;

  return {
    Id,
    LastNumber: Number.isFinite(LastNumber) ? LastNumber : 0,
    DocumentType: Number.isFinite(DocumentType) ? DocumentType : ISSUED_INVOICE_DOCUMENT_TYPE,
    IsDefault: normalizeBool(o.IsDefault ?? o.isDefault),
    Year: Number.isFinite(Year) ? Year : 0,
    NumberFormat: String(o.NumberFormat ?? o.numberFormat ?? ""),
  };
}

function pickIssuedInvoiceSequence(items: IdokladNumericSequence[]): IdokladNumericSequence {
  const issued = items.filter((s) => s.DocumentType === ISSUED_INVOICE_DOCUMENT_TYPE);
  if (!issued.length) {
    throw new Error("V iDokladu chybí číselná řada pro vydané faktury.");
  }

  const currentYear = new Date().getFullYear();
  const picked =
    issued.find((s) => s.IsDefault && s.Year === currentYear) ??
    issued.find((s) => s.IsDefault) ??
    issued.find((s) => s.Year === currentYear) ??
    issued[0];

  if (!picked) {
    throw new Error("V iDokladu chybí výchozí číselná řada pro vydané faktury.");
  }
  return picked;
}

function toIssuedInvoiceSequence(seq: IdokladNumericSequence): IssuedInvoiceSequence {
  return {
    numericSequenceId: seq.Id,
    nextDocumentSerialNumber: String(seq.LastNumber + 1),
  };
}

async function loadSequenceById(id: number): Promise<IssuedInvoiceSequence> {
  const res = await idokladRequest<IdokladItemResponse<unknown>>(
    "GET",
    `NumericSequences/${encodeURIComponent(String(id))}`,
  );
  const seq = parseNumericSequence(res.Data);
  if (!seq) {
    throw new Error(`iDoklad číselná řada ${id} neexistuje nebo má neplatná data.`);
  }
  return toIssuedInvoiceSequence(seq);
}

async function loadDefaultIssuedInvoiceSequence(): Promise<IssuedInvoiceSequence> {
  const res = await idokladRequest<IdokladListResponse<unknown>>(
    "GET",
    `NumericSequences?filter=DocumentType~eq~${ISSUED_INVOICE_DOCUMENT_TYPE}&pageSize=100`,
  );

  const items = (res.Data?.Items ?? [])
    .map(parseNumericSequence)
    .filter((s): s is IdokladNumericSequence => s != null);

  if (!items.length) {
    throw new Error("V iDokladu chybí výchozí číselná řada pro vydané faktury.");
  }

  return toIssuedInvoiceSequence(pickIssuedInvoiceSequence(items));
}

export async function getDefaultIssuedInvoiceSequence(): Promise<IssuedInvoiceSequence> {
  const configuredId = process.env.IDOKLAD_NUMERIC_SEQUENCE_ID?.trim();
  if (configuredId) {
    const id = Number(configuredId);
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error("IDOKLAD_NUMERIC_SEQUENCE_ID musí být kladné číslo.");
    }
    return loadSequenceById(id);
  }

  return loadDefaultIssuedInvoiceSequence();
}
