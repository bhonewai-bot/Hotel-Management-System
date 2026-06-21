import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";
import prisma from "@/lib/prisma";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    twoFactor({
      issuer: "HMS Hotel",
      otpOptions: {
        period: 3,
        digits: 6,
        async sendOTP({ user, otp }) {
          await getResend().emails.send({
            from: "HMS Hotel <onboarding@resend.dev>",
            to: user.email,
            subject: "Your HMS Hotel Login Code",
            html: `
              <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
                <h2>HMS Hotel — Login Verification</h2>
                <p>Your one-time login code is:</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #f4f4f5; border-radius: 8px;">${otp}</p>
                <p style="color: #71717a; font-size: 14px;">This code expires in 3 minutes. If you did not request this, please ignore this email.</p>
              </div>
            `,
          });
        },
      },
    }),
    nextCookies(),
  ],
});
