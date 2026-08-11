// FILE: components/guests/deactivate-guest-dialog.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deactivateGuest, reactivateGuest } from "@/lib/actions/guest";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeactivateGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: { id: string; name: string } | null;
  mode: "deactivate" | "reactivate";
}

export function DeactivateGuestDialog({
  open,
  onOpenChange,
  guest,
  mode,
}: DeactivateGuestDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!guest) return null;

  function handleAction() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("guestId", guest!.id);

      const result =
        mode === "deactivate"
          ? await deactivateGuest(formData)
          : await reactivateGuest(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          mode === "deactivate"
            ? "Guest deactivated successfully"
            : "Guest reactivated successfully",
        );
        onOpenChange(false);
        router.refresh();
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === "deactivate" ? "Deactivate Guest" : "Reactivate Guest"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {mode === "deactivate" ? (
              <>
                Are you sure you want to deactivate{" "}
                <strong>{guest.name}</strong>? They will no longer be able to
                log into the mobile app, but their booking history and account
                data will be preserved.
              </>
            ) : (
              <>
                Are you sure you want to reactivate{" "}
                <strong>{guest.name}</strong>? They will be able to log into the
                mobile app again with their previous credentials.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            disabled={isPending}
            className={
              mode === "deactivate"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                {mode === "deactivate" ? "Deactivating..." : "Reactivating..."}
              </span>
            ) : mode === "deactivate" ? (
              "Deactivate"
            ) : (
              "Reactivate"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
