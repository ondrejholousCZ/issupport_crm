import { idokladDownload } from "@/lib/idoklad/client";

function extractPdfBuffer(payload: unknown): Buffer | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as { Data?: unknown }).Data;
  if (typeof data === "string" && data.length > 0) {
    return Buffer.from(data, "base64");
  }
  if (data && typeof data === "object") {
    const content =
      (data as { Content?: string; Document?: string; Pdf?: string }).Content ??
      (data as { Document?: string }).Document ??
      (data as { Pdf?: string }).Pdf;
    if (typeof content === "string" && content.length > 0) {
      return Buffer.from(content, "base64");
    }
  }
  return null;
}

/** Stáhne PDF vydané faktury z iDokladu (endpoint GetPdf / Report). */
export async function downloadIssuedInvoicePdf(id: number): Promise<Buffer> {
  const paths = [`IssuedInvoices/${id}/GetPdf`, `IssuedInvoices/${id}/Report`];
  let lastError = "PDF faktury se nepodařilo stáhnout z iDokladu.";

  for (const path of paths) {
    try {
      const { buffer, contentType, parsedJson } = await idokladDownload(path);
      if (contentType.includes("application/pdf") || buffer.slice(0, 4).toString() === "%PDF") {
        return buffer;
      }
      const fromJson = extractPdfBuffer(parsedJson);
      if (fromJson) return fromJson;
      lastError = `iDoklad ${path} nevrátil PDF (${contentType || "unknown"}).`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : lastError;
    }
  }

  throw new Error(lastError);
}
