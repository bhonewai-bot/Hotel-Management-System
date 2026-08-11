// FILE: lib/actions/guest.ts
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  updateGuestSchema,
  deactivateGuestSchema,
  reactivateGuestSchema,
} from "@/lib/validations/guest";

// RBAC permission check
async function requireGuestAccess() {
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

  // Only ADMIN and MANAGER can access guest management
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw new Error("Forbidden: Guest management access required");
  }

  return { session, user };
}

// GET all guests (users with GUEST role)
export async function getGuests() {
  await requireGuestAccess();

  // Query users with GUEST role and include their linked guest data
  const users = await prisma.user.findMany({
    where: {
      role: "GUEST",
    },
    include: {
      guests: {
        include: {
          _count: {
            select: { bookings: true },
          },
          profile: {
            select: { totalStays: true, totalSpent: true, lastStayDate: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => {
    const guest = u.guests?.[0]; // Get first linked guest record
    return {
      id: guest?.id || u.id,
      name: guest ? `${guest.firstName} ${guest.lastName}` : u.name || "Unknown",
      firstName: guest?.firstName || u.name?.split(" ")[0] || "",
      lastName: guest?.lastName || u.name?.split(" ").slice(1).join(" ") || "",
      email: guest?.email || u.email || "",
      phone: guest?.phone || "",
      userId: u.id,
      isActive: u.isActive,
      totalBookings: guest?._count.bookings ?? 0,
      totalStays: guest?.profile?.totalStays ?? 0,
      totalSpent: guest?.profile?.totalSpent ? Number(guest.profile.totalSpent) : 0,
      lastStayDate: guest?.profile?.lastStayDate?.toISOString() || null,
      createdAt: u.createdAt.toISOString(),
    };
  });
}

// GET guest details with full booking history
export async function getGuestDetails(guestId: string) {
  await requireGuestAccess();

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
      },
      bookings: {
        include: {
          rooms: {
            include: {
              room: true,
            },
          },
          invoice: true,
        },
        orderBy: { checkIn: "desc" },
      },
      profile: true,
      communications: {
        orderBy: { sentAt: "desc" },
        take: 10,
      },
    },
  });

  if (!guest || !guest.userId) {
    return null;
  }

  return guest;
}

// UPDATE guest info
export async function updateGuest(formData: FormData) {
  const { user: caller } = await requireGuestAccess();

  const parsed = updateGuestSchema.safeParse({
    guestId: formData.get("guestId"),
    firstName: formData.get("firstName") || undefined,
    lastName: formData.get("lastName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const message = Object.values(fieldErrors).flat().join(", ");
    return { success: false as const, error: message || "Invalid input" };
  }

  const { guestId, firstName, lastName, email, phone, address, notes } =
    parsed.data;

  // Verify guest exists and has userId (mobile app user)
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { userId: true },
  });

  if (!guest || !guest.userId) {
    return {
      success: false as const,
      error: "Guest not found or not a mobile user",
    };
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (notes !== undefined) updateData.notes = notes;

    if (Object.keys(updateData).length > 0) {
      await prisma.guest.update({
        where: { id: guestId },
        data: updateData,
      });
    }

    revalidatePath("/dashboard/guests");
    return { success: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update guest";
    return { success: false as const, error: message };
  }
}

// DEACTIVATE guest (set User.isActive to false)
export async function deactivateGuest(formData: FormData) {
  const { user: caller } = await requireGuestAccess();

  const parsed = deactivateGuestSchema.safeParse({
    guestId: formData.get("guestId"),
  });

  if (!parsed.success) {
    return { success: false as const, error: "Invalid guest ID" };
  }

  const { guestId } = parsed.data;

  // Verify guest exists and has userId
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { userId: true, firstName: true, lastName: true },
  });

  if (!guest || !guest.userId) {
    return {
      success: false as const,
      error: "Guest not found or not a mobile user",
    };
  }

  try {
    await prisma.user.update({
      where: { id: guest.userId },
      data: { isActive: false },
    });

    revalidatePath("/dashboard/guests");
    return { success: true as const };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to deactivate guest";
    return { success: false as const, error: message };
  }
}

// REACTIVATE guest
export async function reactivateGuest(formData: FormData) {
  const { user: caller } = await requireGuestAccess();

  const parsed = reactivateGuestSchema.safeParse({
    guestId: formData.get("guestId"),
  });

  if (!parsed.success) {
    return { success: false as const, error: "Invalid guest ID" };
  }

  const { guestId } = parsed.data;

  // Verify guest exists and has userId
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { userId: true },
  });

  if (!guest || !guest.userId) {
    return {
      success: false as const,
      error: "Guest not found or not a mobile user",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: guest.userId },
    select: { isActive: true },
  });

  if (user?.isActive) {
    return { success: false as const, error: "Guest is already active" };
  }

  try {
    await prisma.user.update({
      where: { id: guest.userId },
      data: { isActive: true },
    });

    revalidatePath("/dashboard/guests");
    return { success: true as const };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to reactivate guest";
    return { success: false as const, error: message };
  }
}
