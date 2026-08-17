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
  nextDocumentSerialNumber: number;
};

export async function getDefaultIssuedInvoiceSequence(): Promise<IssuedInvoiceSequence> {
  const configuredId = process.env.IDOKLAD_NUMERIC_SEQUENCE_ID?.trim();
  if (configuredId) {
    const res = await idokladRequest<IdokladItemResponse<IdokladNumericSequence>>(
      "GET",
      `NumericSequences/${encodeURIComponent(configuredId)}`,
    );
    const seq = res.Data;
    if (!seq) {
      throw new Error(`iDoklad číselná řada ${configuredId} neexistuje.`);
    }
    return {
      numericSequenceId: seq.Id,
      nextDocumentSerialNumber: seq.LastNumber + 1,
    };
  }

  const res = await idokladRequest<IdokladListResponse<IdokladNumericSequence>>(
    "GET",
    `NumericSequences?filter=(DocumentType~eq~${ISSUED_INVOICE_DOCUMENT_TYPE})~and~(IsDefault~eq~true)&pageSize=1`,
  );

  const seq = res.Data?.Items?.[0];
  if (!seq) {
    throw new Error("V iDokladu chybí výchozí číselná řada pro vydané faktury.");
  }

  return {
    numericSequenceId: seq.Id,
    nextDocumentSerialNumber: seq.LastNumber + 1,
  };
}
