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
}: {
  vykaz: VykazPrace;
  polozky: OdvedenaPrace[];
  toEmail: string;
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const approveUrl = `${baseUrl}/schvaleni/${vykaz.approval_token}`;

  let total = 0;
  const rowsHtml = polozky
    .map((p) => {
      const castka = polozkaCastka(p);
      total += castka;
      return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;white-space:nowrap">${formatDate(p.datum)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee">${p.projekt_zakazka ?? p.projekt_nazev ?? ""}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee">${p.pracovnik_jmeno ?? ""}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee">${p.popis ?? ""}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatCas(p.hodiny, p.minuty)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatMoney(castka)}</td>
      </tr>`;
    })
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:960px;color:#111">
      <p>Dobrý den,</p>
      <p>zasíláme Vám výkaz práce za období <strong>${obdobiLabel(vykaz.obdobi)}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;table-layout:auto">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:10px;text-align:left;white-space:nowrap">Datum</th>
            <th style="padding:10px;text-align:left">Projekt</th>
            <th style="padding:10px;text-align:left">Pracovník</th>
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
      </table>
      <p>
        <a href="${approveUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Zobrazit a schválit výkaz
        </a>
      </p>
      <p style="color:#666;font-size:13px">Nebo otevřete odkaz: ${approveUrl}</p>
      <p style="color:#666;font-size:13px">S pozdravem,<br>ISSP</p>
    </div>`;

  const workbook = await buildVykazWorkbook(polozky);
  const filename = buildVykazFilename(polozky, vykaz.obdobi);
  const attachmentContent = Buffer.from(workbook).toString("base64");

  await sendEmail({
    to: toEmail,
    subject: `Výkaz práce ${obdobiLabel(vykaz.obdobi)}`,
    html,
    attachments: [
      {
        filename,
        content: attachmentContent,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });
}
