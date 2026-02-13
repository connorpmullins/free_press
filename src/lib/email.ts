import { Resend } from "resend";
import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendWithMailpit(options: SendEmailOptions): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT || "1025"),
    secure: false,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@freepress.news",
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

async function sendWithResend(options: SendEmailOptions): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "noreply@freepress.news",
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  // Default to resend in production, mailpit in development
  const provider =
    process.env.EMAIL_PROVIDER ||
    (process.env.NODE_ENV === "production" ? "resend" : "mailpit");

  if (provider === "resend") {
    await sendWithResend(options);
  } else {
    await sendWithMailpit(options);
  }
}

export async function sendMagicLinkEmail(
  email: string,
  token: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/auth/verify?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Sign in to Free Press",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; font-weight: 700; margin: 0;">Free Press</h1>
            <p style="color: #666; margin-top: 4px; font-size: 14px;">Integrity-enforced journalism</p>
          </div>
          
          <div style="background: #f9fafb; border-radius: 12px; padding: 32px; text-align: center;">
            <h2 style="font-size: 20px; margin: 0 0 12px;">Sign in to your account</h2>
            <p style="color: #666; margin: 0 0 24px; font-size: 15px;">
              Click the button below to securely sign in. This link expires in 15 minutes.
            </p>
            <a href="${verifyUrl}" 
               style="display: inline-block; background: #0a0a0a; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
              Sign In
            </a>
          </div>
          
          <div style="margin-top: 24px; text-align: center; color: #999; font-size: 13px;">
            <p>If you didn't request this email, you can safely ignore it.</p>
            <p style="margin-top: 8px;">
              Can't click the button? Copy this link:<br>
              <a href="${verifyUrl}" style="color: #666; word-break: break-all;">${verifyUrl}</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Sign in to Free Press\n\nClick this link to sign in: ${verifyUrl}\n\nThis link expires in 15 minutes. If you didn't request this email, you can safely ignore it.`,
  });
}
