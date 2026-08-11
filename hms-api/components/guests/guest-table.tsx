// FILE: components/guests/guest-table.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DotsThreeVerticalIcon,
  TrashIcon,
  ArrowCounterClockwiseIcon,
  EyeIcon,
} from "@phosphor-icons/react";

import { DeactivateGuestDialog } from "./deactivate-guest-dialog";

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  totalBookings: number;
  totalStays: number;
  totalSpent: number | { [key: string]: unknown }; // Decimal from Prisma
  lastStayDate: string | null;
  createdAt: string;
}

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

function formatCurrency(amount: number | { [key: string]: unknown }) {
  if (typeof amount === "number") {
    return `${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} MMK`;
  }
  return "-";
}

interface GuestTableProps {
  guests: Guest[];
}

export function GuestTable({ guests }: GuestTableProps) {
  const router = useRouter();
  const [deactivateGuest, setDeactivateGuest] = useState<Guest | null>(null);
  const [reactivateGuest, setReactivateGuest] = useState<Guest | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Guest Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage customer accounts registered from mobile app.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Last Stay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  No guests found.
                </TableCell>
              </TableRow>
            ) : (
              guests.map((guest) => (
                <TableRow
                  key={guest.id}
                  className={!guest.isActive ? "opacity-60" : ""}
                >
                  {/* Guest Name */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(guest.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{guest.name}</span>
                    </div>
                  </TableCell>

                  {/* Email */}
                  <TableCell className="text-muted-foreground text-sm">
                    {guest.email}
                  </TableCell>

                  {/* Phone */}
                  <TableCell className="text-muted-foreground text-sm">
                    {guest.phone || "-"}
                  </TableCell>

                  {/* Bookings Count */}
                  <TableCell>
                    <Badge variant="outline">
                      {guest.totalBookings} bookings
                    </Badge>
                  </TableCell>

                  {/* Total Spent */}
                  <TableCell className="text-sm">
                    {formatCurrency(guest.totalSpent as number)}
                  </TableCell>

                  {/* Last Stay Date */}
                  <TableCell className="text-muted-foreground text-sm">
                    {guest.lastStayDate ? formatDate(guest.lastStayDate) : "-"}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    {!guest.isActive ? (
                      <Badge variant="destructive">Inactive</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600">
                        Active
                      </Badge>
                    )}
                  </TableCell>

                  {/* Created Date */}
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(guest.createdAt)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <DotsThreeVerticalIcon className="size-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* View Guest Details */}
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/guests/${guest.id}`}>
                            <EyeIcon className="mr-2 size-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>

                        {/* Deactivate/Reactivate */}
                        {!guest.isActive ? (
                          <DropdownMenuItem
                            onClick={() => setReactivateGuest(guest)}
                          >
                            <ArrowCounterClockwiseIcon className="mr-2 size-4" />
                            Reactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeactivateGuest(guest)}
                          >
                            <TrashIcon className="mr-2 size-4" />
                            Deactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <DeactivateGuestDialog
        open={!!deactivateGuest}
        onOpenChange={(o) => {
          if (!o) setDeactivateGuest(null);
        }}
        guest={deactivateGuest}
        mode="deactivate"
      />
      <DeactivateGuestDialog
        open={!!reactivateGuest}
        onOpenChange={(o) => {
          if (!o) setReactivateGuest(null);
        }}
        guest={reactivateGuest}
        mode="reactivate"
      />
    </div>
  );
}
