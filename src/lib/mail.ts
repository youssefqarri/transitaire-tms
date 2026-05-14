import "server-only";
import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error(
      "SMTP non configuré (SMTP_HOST, SMTP_USER, SMTP_PASS dans .env)",
    );
  }
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // SSL pour 465, sinon STARTTLS
    auth: { user, pass },
  });
  return cachedTransporter;
}

export type SendMailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
};

export async function sendMail(opts: SendMailOptions): Promise<{ messageId: string }> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    replyTo: opts.replyTo,
  });
  return { messageId: info.messageId };
}

/** Convertit un body texte (plain) en HTML simple en préservant les sauts de ligne et liens. */
export function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // liens http(s) → <a>
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#3b5bdb">$1</a>',
  );
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;white-space:pre-wrap">${linked}</div>`;
}
