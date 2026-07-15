import { z } from "zod/v4";

const userRoles = ["ADMIN", "MANAGER", "FRONT_DESK", "HOUSEKEEPING", "MAINTENANCE"] as const;

export const createStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: z.enum(userRoles),
});

export const updateStaffSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(2).max(100).optional(),
  email: z.email().optional(),
  role: z.enum(userRoles).optional(),
});

export const deleteStaffSchema = z.object({
  userId: z.string().min(1),
});

export const reactivateStaffSchema = z.object({
  userId: z.string().min(1),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
