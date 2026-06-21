"use server";

import { z } from "zod/v4";
import prisma from "@/lib/prisma";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function ensureTwoFactorEnabled(
  prevState: unknown,
  formData: FormData
) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, twoFactorEnabled: true },
  });

  if (!user) {
    return { success: true };
  }

  if (!user.twoFactorEnabled) {
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });
  }

  return { success: true };
}
