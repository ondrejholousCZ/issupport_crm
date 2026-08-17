import { EMAIL_LOGO_BASE64, EMAIL_LOGO_MIME } from "@/lib/email/logo-data";
import type { EmailAttachment } from "@/lib/sendgrid";

export const EMAIL_LOGO_CONTENT_ID = "issp-logo";

/** Inline logo pro e-maily — vložené v bundle, funguje i na Vercelu. */
export function getEmailLogoInlineAttachment(): EmailAttachment {
  return {
    filename: "logo-issp.jpg",
    content: EMAIL_LOGO_BASE64,
    type: EMAIL_LOGO_MIME,
    disposition: "inline",
    contentId: EMAIL_LOGO_CONTENT_ID,
  };
}
