import { sendVykazApprovalEmail } from "@/lib/vykaz-email";

export type EmailAttachment = {
  filename: string;
  content: string;
  type: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const fromName = process.env.SENDGRID_FROM_NAME ?? "ISSP";

  if (!apiKey || !fromEmail) {
    throw new Error("SendGrid není nakonfigurován (SENDGRID_API_KEY, SENDGRID_FROM_EMAIL).");
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: fromName },
      subject,
      content: [{ type: "text/html", value: html }],
      // Link branding (url1470.issupport.cz) nemá SSL — click tracking by rozbil HTTPS odkazy.
      tracking_settings: {
        click_tracking: { enable: false, enable_text: false },
        open_tracking: { enable: false },
      },
      attachments: attachments?.map((a) => ({
        content: a.content,
        filename: a.filename,
        type: a.type,
        disposition: "attachment",
      })),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SendGrid chyba ${res.status}: ${body.slice(0, 200)}`);
  }
}

export { sendVykazApprovalEmail };
