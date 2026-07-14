import { Resend } from "resend";
import { renderOtpEmail } from "@/components/emails/otp";
import { renderVerificationEmail } from "@/components/emails/verification";
import { renderResetPasswordEmail } from "@/components/emails/reset-password";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

type SendEmailOptions = {
  to: string;
  subject: string;
  html?: string;
  text: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const from = process.env.RESEND_FROM_EMAIL ?? "HMS Hotel <onboarding@resend.dev>";

  const { error } = await getResend().emails.send({
    from,
    to,
    subject,
    html: html ?? `<p>${text}</p>`,
    text,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendOTP(to: string, otp: string) {
  await sendEmail({
    to,
    subject: "Your HMS Hotel sign-in code",
    text: `Your HMS Hotel sign-in code is: ${otp}. It expires in 5 minutes.\n\nIf you didn't try to sign in, you can safely ignore this email.`,
    html: renderOtpEmail({ otp }),
  });
}

export async function sendVerificationEmail(to: string, url: string) {
  await sendEmail({
    to,
    subject: "Verify your email - HMS Hotel",
    text: `Click the link to verify your email: ${url}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: renderVerificationEmail({ url, email: to }),
  });
}

export async function sendResetPasswordEmail(to: string, url: string) {
  await sendEmail({
    to,
    subject: "Reset your password - HMS Hotel",
    text: `Click the link to reset your password: ${url}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: renderResetPasswordEmail({ url, email: to }),
  });
}
