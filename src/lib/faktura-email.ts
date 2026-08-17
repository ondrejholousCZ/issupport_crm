import { buildBrandedEmailHtml } from "@/lib/email/branded-template";
import { getEmailLogoInlineAttachment } from "@/lib/email/logo-inline";
import { getFakturaDocumentUrl } from "@/lib/faktura-document-url";
import { formatDateLong, formatMoney } from "@/lib/format";
import { MESICE_LABELS } from "@/lib/prace-filters";
import { downloadFakturaPdf } from "@/lib/storage/faktura-blob";
import type { Faktura } from "@/lib/types";
import { sendEmail } from "@/lib/sendgrid";

function fakturaAttachmentFilename(cisloFaktury: string | null): string {
  const base = (cisloFaktury?.trim() || "faktura").replace(/[^\w.-]+/g, "_").replace(/_+/g, "_");
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

function obdobiLabel(obdobi: string): string {
  const [rok, mesic] = obdobi.split("-");
  if (!mesic) return obdobi;
  const idx = Number(mesic) - 1;
  return `${MESICE_LABELS[idx] ?? mesic} ${rok}`;
}

export async function sendFakturaEmail({
  faktura,
  toEmail,
  zakaznikNazev,
  obdobi,
}: {
  faktura: Faktura;
  toEmail: string;
  zakaznikNazev: string;
  obdobi?: string | null;
}) {
  const invoiceUrl = getFakturaDocumentUrl(faktura, { fresh: true });
  if (!faktura.pdf_blob_path || !invoiceUrl) {
    throw new Error("Faktura nemá PDF v úložišti — nejdříve ji vystavte v iDokladu.");
  }

  const pdf = await downloadFakturaPdf(faktura.pdf_blob_path);

  const details: Array<{ label: string; value: string }> = [
    { label: "Číslo faktury", value: faktura.cislo_faktury ?? "—" },
    { label: "Částka", value: formatMoney(faktura.castka_celkem) },
  ];

  if (obdobi) {
    details.push({ label: "Fakturační období", value: obdobiLabel(obdobi) });
  }
  if (faktura.datum_duzp) {
    details.push({ label: "DUZP", value: formatDateLong(faktura.datum_duzp) });
  }
  if (faktura.datum_vystaveni) {
    details.push({ label: "Datum fakturace", value: formatDateLong(faktura.datum_vystaveni) });
  }
  if (faktura.datum_splatnosti) {
    details.push({ label: "Datum splatnosti", value: formatDateLong(faktura.datum_splatnosti) });
  }

  const logo = getEmailLogoInlineAttachment();

  const html = buildBrandedEmailHtml({
    title: `Faktura vydaná pro ${zakaznikNazev}`,
    paragraphs: [
      "Dobrý den,",
      "zasíláme Vám fakturu za poskytnuté služby v příloze tohoto e-mailu. Dokument si můžete také zobrazit pomocí odkazu níže.",
    ],
    details,
    cta: { label: "Zobrazit fakturu", href: invoiceUrl },
    plainLink: invoiceUrl,
  });

  const subject = faktura.cislo_faktury
    ? `Faktura ${faktura.cislo_faktury}`
    : "Faktura IS Support s. r. o.";

  await sendEmail({
    to: toEmail,
    subject,
    html,
    attachments: [
      logo,
      {
        filename: fakturaAttachmentFilename(faktura.cislo_faktury),
        content: pdf.toString("base64"),
        type: "application/pdf",
      },
    ],
  });
}
