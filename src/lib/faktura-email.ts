import { buildBrandedEmailHtml } from "@/lib/email/branded-template";
import { normalizeIdokladInvoiceUrl } from "@/lib/idoklad/invoices";
import { formatDateLong, formatMoney } from "@/lib/format";
import { MESICE_LABELS } from "@/lib/prace-filters";
import type { Faktura } from "@/lib/types";
import { sendEmail } from "@/lib/sendgrid";

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
  const invoiceUrl = normalizeIdokladInvoiceUrl(faktura.idoklad_url, faktura.idoklad_id);
  if (!invoiceUrl) {
    throw new Error("Faktura nemá odkaz do iDokladu — nejdříve ji vystavte v iDokladu.");
  }

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

  const html = buildBrandedEmailHtml({
    title: `Faktura společnosti ${zakaznikNazev}`,
    paragraphs: [
      "Dobrý den,",
      "zasíláme Vám fakturu za poskytnuté služby. Dokument si můžete zobrazit a stáhnout v iDokladu.",
    ],
    details,
    cta: { label: "Zobrazit fakturu", href: invoiceUrl },
    plainLink: invoiceUrl,
  });

  const subject = faktura.cislo_faktury
    ? `Faktura ${faktura.cislo_faktury}`
    : "Faktura IS Support s. r. o.";

  await sendEmail({ to: toEmail, subject, html });
}
