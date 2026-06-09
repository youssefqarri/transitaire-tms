import "server-only";
import nodemailer from "nodemailer";
import { getSettings } from "./settings";

export type SendMailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
};

async function buildTransporter(): Promise<nodemailer.Transporter> {
  const s = await getSettings();
  if (!s.smtpHost || !s.smtpUser || !s.smtpPass) {
    throw new Error("SMTP non configuré (Paramètres → Email sortant)");
  }
  return nodemailer.createTransport({
    host: s.smtpHost,
    port: s.smtpPort ?? 587,
    secure: s.smtpSecure || (s.smtpPort ?? 587) === 465,
    auth: { user: s.smtpUser, pass: s.smtpPass },
  });
}

export async function sendMail(opts: SendMailOptions): Promise<{ messageId: string }> {
  const s = await getSettings();
  const from = s.smtpFrom || s.smtpUser!;
  const transporter = await buildTransporter();
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

/** Vérifie juste la connexion SMTP (login). */
export async function verifySmtp(): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = await buildTransporter();
    await transporter.verify();
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message };
  }
}

export function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  // regex d'URL restreinte (n'inclut ni guillemets ni chevrons) pour éviter de casser l'attribut href
  const linked = escaped.replace(
    /(https?:\/\/[^\s"'<>]+)/g,
    '<a href="$1" style="color:#3b5bdb">$1</a>',
  );
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;white-space:pre-wrap">${linked}</div>`;
}
