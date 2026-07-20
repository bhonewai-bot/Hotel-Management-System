"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createStaffSchema,
  updateStaffSchema,
  deleteStaffSchema,
  reactivateStaffSchema,
} from "@/lib/validations/staff";

// Privileged roles that require ADMIN access to manage
const PRIVILEGED_ROLES = ["ADMIN", "MANAGER"] as const;

// Roles that require 2FA by default
const ROLES_REQUIRING_2FA = ["ADMIN", "MANAGER"] as const;

function generateSecret(length = 20): string {
  return randomBytes(length).toString("base64url");
}

function generateBackupCodes(count = 10, length = 8): string {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(
      randomBytes(length).toString("hex").slice(0, length).toUpperCase(),
    );
  }
  return codes.join(",");
}

async function requireStaffAccess() {
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

  if (!user) {
    throw new Error("User not found");
  }

  // Check permission using RBAC system instead of hardcoded roles
  const hasPermission = await auth.api.userHasPermission({
    headers: hdrs,
    body: {
      userId: session.user.id,
      permissions: { staff: ["read"] },
    },
  });

  if (!hasPermission) {
    throw new Error("Forbidden: Staff management access required");
  }

  return { session, user };
}

function canManageUser(callerRole: string, targetRole: string): boolean {
  // ADMIN can manage everyone
  if (callerRole === "ADMIN") return true;

  // MANAGER can only manage non-privileged roles
  if (callerRole === "MANAGER") {
    return !PRIVILEGED_ROLES.includes(
      targetRole as (typeof PRIVILEGED_ROLES)[number],
    );
  }

  return false;
}

export async function getStaff() {
  await requireStaffAccess();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      image: true,
    },
  });

  return users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function createStaff(formData: FormData) {
  const { user: caller } = await requireStaffAccess();

  const parsed = createStaffSchema.safeParse({
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

  // Check if caller can create this role
  if (!canManageUser(caller.role, role)) {
    return {
      success: false as const,
      error: "You cannot create users with this role",
    };
  }

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
      return {
        success: false as const,
        error: message || "Failed to create user",
      };
    }

    // signUp.email defaults role to FRONT_DESK, so update it
    const newUser = await prisma.user.findUnique({ where: { email } });
    if (newUser) {
      const updateData: {
        role?:
          | "ADMIN"
          | "MANAGER"
          | "FRONT_DESK"
          | "HOUSEKEEPING"
          | "MAINTENANCE";
        emailVerified?: boolean;
        twoFactorEnabled?: boolean;
      } = {};

      // Update role if not FRONT_DESK (default)
      if (role !== "FRONT_DESK") {
        updateData.role = role as
          | "ADMIN"
          | "MANAGER"
          | "FRONT_DESK"
          | "HOUSEKEEPING"
          | "MAINTENANCE";
      }

      // Set emailVerified to true so staff can log in immediately
      updateData.emailVerified = true;

      // Enable 2FA for ADMIN and MANAGER roles
      const requires2FA = ROLES_REQUIRING_2FA.includes(
        role as (typeof ROLES_REQUIRING_2FA)[number],
      );
      if (requires2FA) {
        updateData.twoFactorEnabled = true;
      }

      await prisma.user.update({
        where: { id: newUser.id },
        data: updateData,
      });

      // Create TwoFactor record for roles requiring 2FA
      if (requires2FA) {
        await prisma.twoFactor.create({
          data: {
            id: crypto.randomUUID(),
            userId: newUser.id,
            secret: generateSecret(),
            backupCodes: generateBackupCodes(),
            verified: true,
          },
        });
      }
    }

    revalidatePath("/dashboard/staff");
    return { success: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create user";
    return { success: false as const, error: message };
  }
}

export async function updateStaff(formData: FormData) {
  const { user: caller } = await requireStaffAccess();

  const parsed = updateStaffSchema.safeParse({
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

  // Load target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    return { success: false as const, error: "User not found" };
  }

  // Prevent self-modification
  if (userId === caller.id) {
    return {
      success: false as const,
      error: "You cannot modify your own account",
    };
  }

  // Check if caller can manage this user
  if (!canManageUser(caller.role, targetUser.role)) {
    return {
      success: false as const,
      error: "You cannot modify users with this role",
    };
  }

  // Check if caller can assign this role
  if (role && !canManageUser(caller.role, role)) {
    return {
      success: false as const,
      error: "You cannot assign this role",
    };
  }

  // Prevent demoting the last admin
  if (role && targetUser.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    if (adminCount <= 1) {
      return {
        success: false as const,
        error: "Cannot demote the last admin account",
      };
    }
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

    revalidatePath("/dashboard/staff");
    return { success: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update user";
    return { success: false as const, error: message };
  }
}

export async function deactivateStaff(formData: FormData) {
  const { user: caller } = await requireStaffAccess();

  const parsed = deleteStaffSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return { success: false as const, error: "Invalid user ID" };
  }

  const { userId } = parsed.data;

  // Load target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    return { success: false as const, error: "User not found" };
  }

  // Prevent self-deactivation
  if (userId === caller.id) {
    return {
      success: false as const,
      error: "You cannot deactivate your own account",
    };
  }

  // Check if caller can manage this user
  if (!canManageUser(caller.role, targetUser.role)) {
    return {
      success: false as const,
      error: "You cannot deactivate users with this role",
    };
  }

  // Prevent deactivating the last admin
  if (targetUser.role === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    });

    if (adminCount <= 1) {
      return {
        success: false as const,
        error: "Cannot deactivate the last admin account",
      };
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    revalidatePath("/dashboard/staff");
    return { success: true as const };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to deactivate user";
    return { success: false as const, error: message };
  }
}

export async function reactivateStaff(formData: FormData) {
  const { user: caller } = await requireStaffAccess();

  const parsed = reactivateStaffSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return { success: false as const, error: "Invalid user ID" };
  }

  const { userId } = parsed.data;

  // Load target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });

  if (!targetUser) {
    return { success: false as const, error: "User not found" };
  }

  if (targetUser.isActive) {
    return { success: false as const, error: "User is already active" };
  }

  // Check if caller can manage this user
  if (!canManageUser(caller.role, targetUser.role)) {
    return {
      success: false as const,
      error: "You cannot reactivate users with this role",
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    revalidatePath("/dashboard/staff");
    return { success: true as const };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to reactivate user";
    return { success: false as const, error: message };
  }
}
