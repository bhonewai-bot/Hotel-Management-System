import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin, twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma";
import {
  sendOTP,
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "@/lib/email";
import { ac, roles } from "@/lib/rbac";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: ["hmsbooking://"],
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    customRules: {
      "/api/auth/sign-in/email": { window: 60, max: 5 },
      "/api/auth/sign-in/social": { window: 60, max: 5 },
      "/api/auth/sign-up/email": { window: 60, max: 3 },
      "/api/auth/two-factor/verify-otp": { window: 60, max: 5 },
      "/api/auth/two-factor/send-otp": { window: 60, max: 3 },
    },
  },
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
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
    adminPlugin({
      ac,
      roles,
      defaultRole: "FRONT_DESK",
      adminRoles: ["ADMIN"],
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.guest.create({
            data: {
              firstName: user.name?.split(" ")[0] || "",
              lastName: user.name?.split(" ").slice(1).join(" ") || "",
              email: user.email,
              phone: user.phone,
              profile: {
                create: {
                  totalStays: 0,
                  totalSpent: 0,
                  marketingOptIn: true,
                },
              },
            },
          });
        },
      },
    },
  },
});
