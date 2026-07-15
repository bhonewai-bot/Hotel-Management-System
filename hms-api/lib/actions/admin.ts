"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createAdminSchema,
  updateAdminSchema,
  deleteAdminSchema,
} from "@/lib/validations/admin";

async function requireAdmin() {
  const hdrs = await headers();
  const session = await auth.api.getSession({
    headers: hdrs,
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, name: true, email: true },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  return { session, user };
}

export async function getUsers() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      image: true,
    },
  });

  return users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function createUser(formData: FormData) {
  await requireAdmin();


  const parsed = createAdminSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const message = Object.values(fieldErrors).flat().join(", ");
    return { success: false as const, error: message || "Invalid input" };
  }

  const { name, email, password, role } = parsed.data;

  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });

    if (!result || "error" in result) {
      const message =
        result && "error" in result
          ? (result as { error: { message?: string } }).error?.message
          : "Failed to create user";
      return { success: false as const, error: message || "Failed to create user" };
    }

    // signUp.email defaults role to FRONT_DESK, so update it
    const newUser = await prisma.user.findUnique({ where: { email } });
    if (newUser && role !== "FRONT_DESK") {
      await prisma.user.update({
        where: { id: newUser.id },
        data: { role },
      });
    }

    revalidatePath("/dashboard/admins");
    return { success: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create user";
    return { success: false as const, error: message };
  }
}

export async function updateUser(formData: FormData) {
  const { user: adminUser } = await requireAdmin();

  const parsed = updateAdminSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    role: formData.get("role") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const message = Object.values(fieldErrors).flat().join(", ");
    return { success: false as const, error: message || "Invalid input" };
  }

  const { userId, name, email, role } = parsed.data;

  // Prevent self-demotion
  if (userId === adminUser.id && role && role !== "ADMIN") {
    return {
      success: false as const,
      error: "You cannot change your own role",
    };
  }

  try {
    // Update name/email via Prisma
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    // Update role separately
    if (role) {
      await prisma.user.update({
        where: { id: userId },
        data: { role },
      });
    }

    revalidatePath("/dashboard/admins");
    return { success: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update user";
    return { success: false as const, error: message };
  }
}

export async function deleteUser(formData: FormData) {
  const { user: adminUser } = await requireAdmin();

  const parsed = deleteAdminSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return { success: false as const, error: "Invalid user ID" };
  }

  const { userId } = parsed.data;

  // Prevent self-deletion
  if (userId === adminUser.id) {
    return {
      success: false as const,
      error: "You cannot delete your own account",
    };
  }

  // Prevent deleting the last admin
  const adminCount = await prisma.user.count({
    where: { role: "ADMIN" },
  });
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (adminCount <= 1 && targetUser?.role === "ADMIN") {
    return {
      success: false as const,
      error: "Cannot delete the last admin account",
    };
  }

  try {
    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/dashboard/admins");
    return { success: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete user";
    return { success: false as const, error: message };
  }
}
