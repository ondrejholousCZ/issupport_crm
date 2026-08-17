import { idokladDownload } from "@/lib/idoklad/client";

/** GetPdf je dostupné jen v API v2 (v3 vrací UnsupportedApiVersion). */
const IDOKLAD_V2_API_BASE = "https://api.idoklad.cz/v2";

function extractPdfBuffer(payload: unknown): Buffer | null {
  if (typeof payload === "string" && payload.length > 0) {
    return Buffer.from(payload, "base64");
  }
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

/** Stáhne PDF vydané faktury z iDokladu (API v2 /GetPdf). */
export async function downloadIssuedInvoicePdf(id: number): Promise<Buffer> {
  const url = `${IDOKLAD_V2_API_BASE}/IssuedInvoices/${id}/GetPdf`;
  const { buffer, contentType, parsedJson } = await idokladDownload(url);

  if (contentType.includes("application/pdf") || buffer.slice(0, 4).toString() === "%PDF") {
    return buffer;
  }

  const fromJson = extractPdfBuffer(parsedJson);
  if (fromJson && fromJson.slice(0, 4).toString() === "%PDF") {
    return fromJson;
  }

  throw new Error(
    `iDoklad GetPdf nevrátil PDF pro fakturu ${id} (${contentType || "unknown"}).`,
  );
}
