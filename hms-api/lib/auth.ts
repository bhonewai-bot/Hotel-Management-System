import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma";
import {
  sendOTP,
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "@/lib/email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      void sendResetPasswordEmail(user.email, url);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void sendVerificationEmail(user.email, url);
    },
  },
  plugins: [
    expo(),
    twoFactor({
      issuer: "HMS Hotel",
      skipVerificationOnEnable: true,
      otpOptions: {
        period: 5,
        digits: 6,
        async sendOTP({ user, otp }) {
          void sendOTP(user.email, otp);
        },
      },
    }),
    nextCookies(),
  ],
});
