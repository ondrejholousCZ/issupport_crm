import { getAppUrl } from "@/lib/app-url";
import { buildBrandedEmailHtml } from "@/lib/email/branded-template";
import { getEmailLogoInlineAttachment } from "@/lib/email/logo-inline";
import { buildVykazFilename, buildVykazWorkbook } from "@/lib/export/vykazPrace";
import { formatCas, formatDate, formatMoney } from "@/lib/format";
import { MESICE_LABELS } from "@/lib/prace-filters";
import type { OdvedenaPrace, VykazPrace } from "@/lib/types";
import { exportCastka } from "@/lib/work-hours";
import { sendEmail } from "@/lib/sendgrid";

function obdobiLabel(obdobi: string): string {
  const [rok, mesic] = obdobi.split("-");
  if (!mesic) return obdobi;
  const idx = Number(mesic) - 1;
  return `${MESICE_LABELS[idx] ?? mesic} ${rok}`;
}

function polozkaCastka(row: OdvedenaPrace): number {
  return exportCastka(
    row.hodiny,
    row.minuty,
    row.projekt_sazba_fak,
    row.castka_fakturace,
    row.projekt_jednotka_sazby ?? "hodina",
  );
}

export async function sendVykazApprovalEmail({
  vykaz,
  polozky,
  toEmail,
  zakaznikNazev,
}: {
  vykaz: VykazPrace;
  polozky: OdvedenaPrace[];
  toEmail: string;
  zakaznikNazev: string;
}) {
  const approveUrl = `${getAppUrl()}/schvaleni/${vykaz.approval_token}`;

  let total = 0;
  const rowsHtml = polozky
    .map((p) => {
      const castka = polozkaCastka(p);
      total += castka;
      return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;white-space:nowrap">${formatDate(p.datum)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee">${p.projekt_zakazka ?? p.projekt_nazev ?? ""}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;white-space:nowrap">${p.pracovnik_jmeno ?? ""}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee">${p.popis ?? ""}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatCas(p.hodiny, p.minuty)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatMoney(castka)}</td>
      </tr>`;
    })
    .join("");

  const tableHtml = `
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;table-layout:fixed">
      <colgroup>
        <col style="width:10%">
        <col style="width:9%">
        <col style="width:14%">
        <col style="width:48%">
        <col style="width:8%">
        <col style="width:11%">
      </colgroup>
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:10px;text-align:left;white-space:nowrap">Datum</th>
          <th style="padding:10px;text-align:left">Projekt</th>
          <th style="padding:10px;text-align:left;white-space:nowrap">Pracovník</th>
          <th style="padding:10px;text-align:left">Popis</th>
          <th style="padding:10px;text-align:right;white-space:nowrap">Čas</th>
          <th style="padding:10px;text-align:right;white-space:nowrap">Částka</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="5" style="padding:12px 10px;text-align:right;font-weight:bold">Celkem</td>
          <td style="padding:12px 10px;text-align:right;font-weight:bold;white-space:nowrap">${formatMoney(total)}</td>
        </tr>
      </tfoot>
    </table>`;

  const html = buildBrandedEmailHtml({
    title: `Výkaz práce pro společnost ${zakaznikNazev}`,
    maxWidth: 832,
    paragraphs: [
      "Dobrý den,",
      `zasíláme Vám výkaz práce za období ${obdobiLabel(vykaz.obdobi)}. Podrobný přehled najdete v tabulce níže a v příloze ve formátu Excel.`,
    ],
    details: [
      { label: "Období", value: obdobiLabel(vykaz.obdobi) },
      { label: "Celková částka", value: formatMoney(total) },
    ],
    extraHtml: tableHtml,
    cta: { label: "Zobrazit a schválit výkaz", href: approveUrl },
    plainLink: approveUrl,
  });

  const workbook = await buildVykazWorkbook(polozky);
  const filename = buildVykazFilename(polozky, vykaz.obdobi, true);
  const attachmentContent = Buffer.from(workbook).toString("base64");

  await sendEmail({
    to: toEmail,
    subject: `Výkaz práce ${obdobiLabel(vykaz.obdobi)}`,
    html,
    attachments: [
      getEmailLogoInlineAttachment(),
      {
        filename,
        content: attachmentContent,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });
}
