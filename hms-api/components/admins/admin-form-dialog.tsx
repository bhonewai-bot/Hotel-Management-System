"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createUser, updateUser } from "@/lib/actions/admin";
import { createAdminSchema, updateAdminSchema } from "@/lib/validations/admin";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = ["ADMIN", "MANAGER", "FRONT_DESK", "HOUSEKEEPING", "MAINTENANCE"] as const;

type CreateFormValues = z.infer<typeof createAdminSchema>;
type UpdateFormValues = z.infer<typeof updateAdminSchema>;

interface AdminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  user?: { id: string; name: string; email: string; role: string };
}

export function AdminFormDialog({
  open,
  onOpenChange,
  mode,
  user,
}: AdminFormDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (mode === "create") {
    return (
      <CreateForm
        open={open}
        onOpenChange={onOpenChange}
        isPending={isPending}
        startTransition={startTransition}
        router={router}
      />
    );
  }

  if (mode === "edit" && !user) {
    return null;
  }

  return (
    <EditForm
      open={open}
      onOpenChange={onOpenChange}
      user={user!}
      isPending={isPending}
      startTransition={startTransition}
      router={router}
    />
  );
}

function CreateForm({
  open,
  onOpenChange,
  isPending,
  startTransition,
  router,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  router: ReturnType<typeof useRouter>;
}) {
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { name: "", email: "", password: "", role: "FRONT_DESK" },
  });

  function onSubmit(data: CreateFormValues) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("role", data.role);

      const result = await createUser(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User created successfully");
        form.reset();
        onOpenChange(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new account with a password.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@hotel.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min. 8 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Saving...
                  </span>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  open,
  onOpenChange,
  user,
  isPending,
  startTransition,
  router,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name: string; email: string; role: string };
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  router: ReturnType<typeof useRouter>;
}) {
  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateAdminSchema),
    defaultValues: {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UpdateFormValues["role"],
    },
  });

  function onSubmit(data: UpdateFormValues) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", data.userId);
      if (data.name) formData.append("name", data.name);
      if (data.email) formData.append("email", data.email);
      if (data.role) formData.append("role", data.role);

      const result = await updateUser(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User updated successfully");
        onOpenChange(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and role.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@hotel.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
