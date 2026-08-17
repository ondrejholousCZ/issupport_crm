import "server-only";

import { getFakturaBlobReadUrl } from "@/lib/storage/faktura-blob";
import type { Faktura } from "@/lib/types";

type FakturaDocumentFields = Pick<Faktura, "pdf_url" | "pdf_blob_path">;

/** Odkaz na PDF faktury v Azure Blob Storage (ne iDoklad). */
export function getFakturaDocumentUrl(
  faktura: FakturaDocumentFields,
  options?: { fresh?: boolean },
): string | null {
  if (faktura.pdf_blob_path && options?.fresh) {
    try {
      return getFakturaBlobReadUrl(faktura.pdf_blob_path);
    } catch {
      return faktura.pdf_url;
    }
  }

  if (faktura.pdf_url) return faktura.pdf_url;
  if (!faktura.pdf_blob_path) return null;

  try {
    return getFakturaBlobReadUrl(faktura.pdf_blob_path);
  } catch {
    return null;
  }
}
