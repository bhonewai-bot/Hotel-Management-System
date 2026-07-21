"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { PlusIcon, DotsThreeVerticalIcon, PencilSimpleIcon, TrashIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";

import { StaffFormDialog } from "./staff-form-dialog";
import { DeactivateStaffDialog } from "./deactivate-staff-dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  image: string | null;
}

const ROLE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ADMIN: "default",
  MANAGER: "secondary",
  FRONT_DESK: "outline",
  HOUSEKEEPING: "outline",
  MAINTENANCE: "outline",
};

const PRIVILEGED_ROLES = ["ADMIN", "MANAGER"];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface StaffTableProps {
  users: User[];
  callerRole: string;
  callerId: string;
}

export function StaffTable({ users, callerRole, callerId }: StaffTableProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [reactivateUser, setReactivateUser] = useState<User | null>(null);

  const canManageUser = (targetRole: string) => {
    if (callerRole === "ADMIN") return true;
    if (callerRole === "MANAGER") return !PRIVILEGED_ROLES.includes(targetRole);
    return false;
  };

  const canEditUser = (user: User) => {
    // Can't edit yourself
    if (user.id === callerId) return false;
    // Check role-based permissions
    return canManageUser(user.role);
  };

  const canDeactivateUser = (user: User) => {
    // Can't deactivate yourself
    if (user.id === callerId) return false;
    // Check role-based permissions
    return canManageUser(user.role);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage staff accounts and roles.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="mr-2 size-4" />
          Add Staff
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No staff members found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className={!user.isActive ? "opacity-60" : ""}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANT[user.role] ?? "outline"}>
                      {user.role.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!user.isActive ? (
                      <Badge variant="destructive">Inactive</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    {/* Only show actions dropdown if user can perform any action on this row */}
                    {(user.id === callerId ? false : canManageUser(user.role)) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <DotsThreeVerticalIcon className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!user.isActive ? (
                            // Reactivate option for inactive users
                            canManageUser(user.role) && (
                              <DropdownMenuItem
                                onClick={() => setReactivateUser(user)}
                              >
                                <ArrowCounterClockwiseIcon className="mr-2 size-4" />
                                Reactivate
                              </DropdownMenuItem>
                            )
                          ) : (
                            // Edit and deactivate options for active users
                            <>
                              {canEditUser(user) && (
                                <DropdownMenuItem
                                  onClick={() => setEditUser(user)}
                                >
                                  <PencilSimpleIcon className="mr-2 size-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canDeactivateUser(user) && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeactivateUser(user)}
                                >
                                  <TrashIcon className="mr-2 size-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <StaffFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        callerRole={callerRole}
      />
      <StaffFormDialog
        open={!!editUser}
        onOpenChange={(o) => { if (!o) setEditUser(null); }}
        mode="edit"
        user={editUser ?? undefined}
        callerRole={callerRole}
      />
      <DeactivateStaffDialog
        open={!!deactivateUser}
        onOpenChange={(o) => { if (!o) setDeactivateUser(null); }}
        user={deactivateUser}
        mode="deactivate"
      />
      <DeactivateStaffDialog
        open={!!reactivateUser}
        onOpenChange={(o) => { if (!o) setReactivateUser(null); }}
        user={reactivateUser}
        mode="reactivate"
      />
    </div>
  );
}
