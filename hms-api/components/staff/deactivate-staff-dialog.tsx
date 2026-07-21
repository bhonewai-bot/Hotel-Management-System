"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deactivateStaff, reactivateStaff } from "@/lib/actions/staff";

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

interface DeactivateStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name: string } | null;
  mode: "deactivate" | "reactivate";
}

export function DeactivateStaffDialog({
  open,
  onOpenChange,
  user,
  mode,
}: DeactivateStaffDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  function handleAction() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", user!.id);

      const result = mode === "deactivate"
        ? await deactivateStaff(formData)
        : await reactivateStaff(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          mode === "deactivate"
            ? "Staff member deactivated successfully"
            : "Staff member reactivated successfully"
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
            {mode === "deactivate" ? "Deactivate Staff" : "Reactivate Staff"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {mode === "deactivate" ? (
              <>
                Are you sure you want to deactivate <strong>{user.name}</strong>?
                They will no longer be able to log in, but their historical data
                will be preserved.
              </>
            ) : (
              <>
                Are you sure you want to reactivate <strong>{user.name}</strong>?
                They will be able to log in again with their previous credentials.
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
            ) : (
              mode === "deactivate" ? "Deactivate" : "Reactivate"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
