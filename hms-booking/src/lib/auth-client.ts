import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { adminClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";
import { ac, roles } from "@/lib/rbac";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
  plugins: [
    expoClient({
      scheme: "hmsbooking",
      storagePrefix: "hmsbooking",
      storage: SecureStore,
    }),
    adminClient({
      ac,
      roles,
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
