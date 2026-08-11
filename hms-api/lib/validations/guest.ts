// FILE: lib/validations/guest.ts
import { z } from "zod";

export const updateGuestSchema = z.object({
  guestId: z.string().cuid("Invalid guest ID"),
  firstName: z.string().min(1, "First name required").optional(),
  lastName: z.string().min(1, "Last name required").optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const deactivateGuestSchema = z.object({
  guestId: z.string().cuid("Invalid guest ID"),
});

export const reactivateGuestSchema = z.object({
  guestId: z.string().cuid("Invalid guest ID"),
});

export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type DeactivateGuestInput = z.infer<typeof deactivateGuestSchema>;
export type ReactivateGuestInput = z.infer<typeof reactivateGuestSchema>;
