import { readFileSync } from "fs";
import path from "path";
import type { EmailAttachment } from "@/lib/sendgrid";

export const EMAIL_LOGO_CONTENT_ID = "issp-logo";

let cachedLogoBase64: string | null = null;

/** Inline logo pro e-maily — nevyžaduje veřejnou URL (CRM je za přihlášením). */
export function getEmailLogoInlineAttachment(): EmailAttachment {
  if (!cachedLogoBase64) {
    const logoPath = path.join(process.cwd(), "public/email/logo-issp.png");
    cachedLogoBase64 = readFileSync(logoPath).toString("base64");
  }

  return {
    filename: "logo-issp.jpg",
    content: cachedLogoBase64,
    type: "image/jpeg",
    disposition: "inline",
    contentId: EMAIL_LOGO_CONTENT_ID,
  };
}
