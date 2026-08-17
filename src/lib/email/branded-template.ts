import { EMAIL_LOGO_CONTENT_ID, EMAIL_LOGO_DISPLAY_PX } from "@/lib/email/logo-inline";

export const COMPANY_NAME = "IS Support s. r. o.";

export type BrandedEmailDetail = {
  label: string;
  value: string;
};

export type BrandedEmailCta = {
  label: string;
  href: string;
};

export function buildBrandedEmailHtml(input: {
  title: string;
  paragraphs: string[];
  details?: BrandedEmailDetail[];
  extraHtml?: string;
  cta?: BrandedEmailCta;
  plainLink?: string;
  /** Výchozí 640px; výkaz práce používá 832px (+30 %). */
  maxWidth?: number;
  /** Vypne logo v hlavičce (např. když není k dispozici soubor). */
  hideLogo?: boolean;
}): string {
  const maxWidth = input.maxWidth ?? 640;
  const logoSrc = `cid:${EMAIL_LOGO_CONTENT_ID}`;
  const logoPx = EMAIL_LOGO_DISPLAY_PX;
  const showLogo = !input.hideLogo;

  const detailsHtml =
    input.details && input.details.length
      ? `<div style="margin:24px 0;font-size:15px;line-height:1.8;color:#111">
${input.details
  .map(
    (d) =>
      `<p style="margin:0 0 8px"><strong>${escapeHtml(d.label)}:</strong> ${escapeHtml(d.value)}</p>`,
  )
  .join("")}
</div>`
      : "";

  const ctaHtml = input.cta
    ? `<p style="margin:28px 0 16px">
  <a href="${escapeAttr(input.cta.href)}"
     style="display:inline-block;background:#0078d4;color:#fff;padding:10px 20px;border-radius:2px;text-decoration:none;font-weight:600;font-size:15px">
    ${escapeHtml(input.cta.label)} &rsaquo;
  </a>
</p>`
    : "";

  const plainLinkHtml = input.plainLink
    ? `<p style="color:#666;font-size:13px;margin:16px 0 0">Nebo otevřete odkaz: ${escapeHtml(input.plainLink)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="cs">
<body style="margin:0;padding:0;background:#fff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#111">
  <div style="max-width:${maxWidth}px;margin:0 auto;padding:32px 24px">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
      <tr>
        ${
          showLogo
            ? `<td style="width:${logoPx}px;padding-right:12px;vertical-align:middle;line-height:0">
          <img src="${escapeAttr(logoSrc)}" width="${logoPx}" height="${logoPx}" alt="${escapeAttr(COMPANY_NAME)}" style="display:block;border:0;outline:none;text-decoration:none;width:${logoPx}px;height:${logoPx}px;max-width:${logoPx}px;max-height:${logoPx}px" />
        </td>`
            : ""
        }
        <td style="vertical-align:middle;font-size:18px;color:#5e5e5e;font-weight:400">${escapeHtml(COMPANY_NAME)}</td>
      </tr>
    </table>

    <h1 style="font-size:26px;font-weight:600;line-height:1.3;margin:0 0 20px;color:#111">${escapeHtml(input.title)}</h1>

    ${input.paragraphs
      .map(
        (p) =>
          `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;color:#111">${escapeHtml(p)}</p>`,
      )
      .join("")}

    ${detailsHtml}
    ${input.extraHtml ?? ""}
    ${ctaHtml}
    ${plainLinkHtml}

    <p style="font-size:15px;line-height:1.6;margin:32px 0 0;color:#111">
      S pozdravem,<br>
      Tým ${escapeHtml(COMPANY_NAME)}
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
